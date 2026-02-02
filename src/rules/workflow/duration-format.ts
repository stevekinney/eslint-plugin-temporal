import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type Options = [
  {
    format?: 'string' | 'number';
  },
];

type MessageIds = 'durationFormat';

type DurationKind = 'string' | 'number';

export const durationFormat = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-duration-format',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a consistent duration literal format (string vs millisecond number) for workflow timers.',
    },
    messages: {
      durationFormat:
        'Use {{ expected }} duration literals for workflow timers (got {{ actual }}).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['string', 'number'],
            description:
              'Preferred duration literal format for timers (string duration vs millisecond number).',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ format: 'string' }],
  },
  defaultOptions: [{ format: 'string' }],
  create(context, [options]) {
    const tracker = new ImportTracker();
    const workflowNamespaceNames = new Set<string>();
    const sleepLocalNames = new Set<string>();
    const conditionLocalNames = new Set<string>();
    const cancellationScopeLocalNames = new Set<string>();
    let importsSeeded = false;

    function seedWorkflowImports(): void {
      const workflowImport = tracker
        .getAllImports()
        .find((imp) => imp.source === TEMPORAL_PACKAGES.workflow);
      if (!workflowImport) return;

      for (const specifier of workflowImport.specifiers) {
        if (specifier.isTypeOnly) continue;

        if (specifier.imported === '*') {
          workflowNamespaceNames.add(specifier.local);
          continue;
        }

        if (specifier.imported === 'sleep') {
          sleepLocalNames.add(specifier.local);
        }

        if (specifier.imported === 'condition') {
          conditionLocalNames.add(specifier.local);
        }

        if (specifier.imported === 'CancellationScope') {
          cancellationScopeLocalNames.add(specifier.local);
        }
      }
    }

    function ensureWorkflowImportsSeeded(): void {
      if (importsSeeded) return;
      seedWorkflowImports();
      importsSeeded = true;
    }

    function isWorkflowNamespace(node: TSESTree.Node): node is TSESTree.Identifier {
      return (
        node.type === AST_NODE_TYPES.Identifier && workflowNamespaceNames.has(node.name)
      );
    }

    function isSleepCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return sleepLocalNames.has(callee.name);
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return isWorkflowNamespace(callee.object) && callee.property.name === 'sleep';
      }

      return false;
    }

    function isConditionCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return conditionLocalNames.has(callee.name);
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return isWorkflowNamespace(callee.object) && callee.property.name === 'condition';
      }

      return false;
    }

    function isCancellationScopeWithTimeoutCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      if (callee.property.type !== AST_NODE_TYPES.Identifier) return false;
      if (callee.property.name !== 'withTimeout') return false;

      const scopeObject = callee.object;
      if (scopeObject.type === AST_NODE_TYPES.Identifier) {
        return cancellationScopeLocalNames.has(scopeObject.name);
      }

      if (
        scopeObject.type === AST_NODE_TYPES.MemberExpression &&
        scopeObject.object.type === AST_NODE_TYPES.Identifier &&
        scopeObject.property.type === AST_NODE_TYPES.Identifier
      ) {
        return (
          isWorkflowNamespace(scopeObject.object) &&
          scopeObject.property.name === 'CancellationScope'
        );
      }

      return false;
    }

    function toExpression(
      arg: TSESTree.CallExpressionArgument | null | undefined,
    ): TSESTree.Expression | null {
      if (!arg) return null;
      if (arg.type === AST_NODE_TYPES.SpreadElement) return null;
      return arg;
    }

    function getDurationArgument(
      node: TSESTree.CallExpression,
    ): TSESTree.Expression | null {
      if (isSleepCall(node)) {
        return toExpression(node.arguments[0]);
      }

      if (isConditionCall(node)) {
        return toExpression(node.arguments[1]);
      }

      if (isCancellationScopeWithTimeoutCall(node)) {
        return toExpression(node.arguments[0]);
      }

      return null;
    }

    function getLiteralKind(node: TSESTree.Expression): DurationKind | null {
      if (node.type === AST_NODE_TYPES.Literal) {
        if (typeof node.value === 'number') return 'number';
        if (typeof node.value === 'string') return 'string';
      }

      if (
        node.type === AST_NODE_TYPES.TemplateLiteral &&
        node.expressions.length === 0 &&
        node.quasis.length === 1
      ) {
        return 'string';
      }

      return null;
    }

    function getExpectedLabel(format: DurationKind): string {
      return format === 'string' ? 'string' : 'millisecond number';
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      CallExpression(node) {
        ensureWorkflowImportsSeeded();

        const durationArg = getDurationArgument(node);
        if (!durationArg) return;

        const literalKind = getLiteralKind(durationArg);
        if (!literalKind) return;

        const expected = options.format ?? 'string';
        if (literalKind === expected) return;

        context.report({
          node: durationArg,
          messageId: 'durationFormat',
          data: {
            expected: getExpectedLabel(expected),
            actual: literalKind,
          },
        });
      },
    };
  },
});
