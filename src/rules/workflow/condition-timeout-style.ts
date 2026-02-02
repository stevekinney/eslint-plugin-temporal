import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type Options = [
  {
    mode?: 'require' | 'disallow';
  },
];

type MessageIds = 'requireTimeout' | 'disallowTimeout';

export const conditionTimeoutStyle = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-condition-timeout-style',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a consistent timeout style for condition() calls (always include or always omit).',
    },
    messages: {
      requireTimeout:
        'Provide a timeout when calling condition() to avoid waiting indefinitely. Configure this rule to disallow timeouts if you prefer the opposite style.',
      disallowTimeout:
        'Omit timeouts when calling condition() to keep timeout handling explicit and consistent. Configure this rule to require timeouts if you prefer the opposite style.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['require', 'disallow'],
            description:
              'Whether condition() calls should always include a timeout or always omit it.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ mode: 'require' }],
  },
  defaultOptions: [{ mode: 'require' }],
  create(context, [options]) {
    const tracker = new ImportTracker();
    const conditionLocalNames = new Set<string>();
    const workflowNamespaceNames = new Set<string>();
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

        if (specifier.imported === 'condition') {
          conditionLocalNames.add(specifier.local);
        }
      }
    }

    function ensureWorkflowImportsSeeded(): void {
      if (importsSeeded) return;
      seedWorkflowImports();
      importsSeeded = true;
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
        return (
          workflowNamespaceNames.has(callee.object.name) &&
          callee.property.name === 'condition'
        );
      }

      return false;
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      CallExpression(node) {
        ensureWorkflowImportsSeeded();
        if (!isConditionCall(node)) return;

        const hasTimeout = node.arguments.length > 1;
        const mode = options.mode ?? 'require';

        if (mode === 'require' && !hasTimeout) {
          context.report({ node, messageId: 'requireTimeout' });
        }

        if (mode === 'disallow' && hasTimeout) {
          context.report({ node, messageId: 'disallowTimeout' });
        }
      },
    };
  },
});
