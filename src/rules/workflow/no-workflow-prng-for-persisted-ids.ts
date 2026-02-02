import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noWorkflowPrngForPersistedIds';

const PERSISTED_CALLS = new Set([
  'startChild',
  'executeChild',
  'continueAsNew',
  'signalExternalWorkflow',
  'upsertSearchAttributes',
  'setMemo',
]);

export const noWorkflowPrngForPersistedIds = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-workflow-prng-for-persisted-ids',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when workflow PRNG values (uuid4/Math.random) are used in persisted IDs or payloads.',
    },
    messages: {
      noWorkflowPrngForPersistedIds:
        'Avoid using workflow PRNG values for persisted IDs or external payloads. Generate the value in an activity/local activity and return it to the workflow.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const tracker = new ImportTracker();
    const uuid4LocalNames = new Set<string>();
    const workflowNamespaceNames = new Set<string>();
    const activityProxyVariables = new Set<string>();
    const directActivityFns = new Set<string>();
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

        if (specifier.imported === 'uuid4') {
          uuid4LocalNames.add(specifier.local);
        }
      }
    }

    function ensureWorkflowImportsSeeded(): void {
      if (importsSeeded) return;
      seedWorkflowImports();
      importsSeeded = true;
    }

    function isUuid4Call(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        if (uuid4LocalNames.size > 0) {
          return uuid4LocalNames.has(callee.name);
        }
        return callee.name === 'uuid4';
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return (
          workflowNamespaceNames.has(callee.object.name) &&
          callee.property.name === 'uuid4'
        );
      }

      return false;
    }

    function isMathRandomCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;
      return (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.object.name === 'Math' &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        callee.property.name === 'random'
      );
    }

    function isPrngCall(node: TSESTree.Node): node is TSESTree.CallExpression {
      if (node.type !== AST_NODE_TYPES.CallExpression) return false;
      return isUuid4Call(node) || isMathRandomCall(node);
    }

    function collectPrngCalls(
      node: TSESTree.Node,
      results: TSESTree.CallExpression[],
      skipPersistedCalls: boolean = false,
    ): void {
      if (
        skipPersistedCalls &&
        node.type === AST_NODE_TYPES.CallExpression &&
        isPersistedWorkflowCall(node)
      ) {
        return;
      }

      if (isPrngCall(node)) {
        results.push(node);
      }

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              collectPrngCalls(child as TSESTree.Node, results, skipPersistedCalls);
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          collectPrngCalls(value as TSESTree.Node, results, skipPersistedCalls);
        }
      }
    }

    function isProxyActivitiesCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        (node.callee.name === 'proxyActivities' ||
          node.callee.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        (node.callee.property.name === 'proxyActivities' ||
          node.callee.property.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      return false;
    }

    function isActivityCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
          return activityProxyVariables.has(node.callee.object.name);
        }
      }

      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return directActivityFns.has(node.callee.name);
      }

      return false;
    }

    function isPersistedWorkflowCall(node: TSESTree.CallExpression): boolean {
      if (isActivityCall(node)) return true;

      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return PERSISTED_CALLS.has(node.callee.name);
      }

      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        if (node.callee.property.type === AST_NODE_TYPES.Identifier) {
          return PERSISTED_CALLS.has(node.callee.property.name);
        }
        if (
          node.callee.property.type === AST_NODE_TYPES.Literal &&
          typeof node.callee.property.value === 'string'
        ) {
          return PERSISTED_CALLS.has(node.callee.property.value);
        }
      }

      return false;
    }

    function reportPrngCalls(nodes: TSESTree.CallExpression[]): void {
      for (const prngCall of nodes) {
        context.report({ node: prngCall, messageId: 'noWorkflowPrngForPersistedIds' });
      }
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      VariableDeclarator(node) {
        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isProxyActivitiesCall(node.init)) return;

        if (node.id.type === AST_NODE_TYPES.Identifier) {
          activityProxyVariables.add(node.id.name);
          return;
        }

        if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
          for (const property of node.id.properties) {
            if (
              property.type === AST_NODE_TYPES.Property &&
              property.key.type === AST_NODE_TYPES.Identifier
            ) {
              directActivityFns.add(property.key.name);
            }
          }
        }
      },
      CallExpression(node) {
        if (!isPersistedWorkflowCall(node)) return;

        ensureWorkflowImportsSeeded();
        const prngCalls: TSESTree.CallExpression[] = [];

        for (const arg of node.arguments) {
          if (!arg) continue;
          collectPrngCalls(arg, prngCalls);
        }

        if (prngCalls.length > 0) {
          reportPrngCalls(prngCalls);
        }
      },
      ReturnStatement(node) {
        if (!node.argument) return;

        ensureWorkflowImportsSeeded();
        const prngCalls: TSESTree.CallExpression[] = [];
        collectPrngCalls(node.argument, prngCalls, true);

        if (prngCalls.length > 0) {
          reportPrngCalls(prngCalls);
        }
      },
    };
  },
});
