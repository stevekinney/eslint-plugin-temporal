import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'preferLocalActivity';

const ID_KEYWORDS = ['id', 'uuid', 'uid', 'token', 'key', 'ref', 'reference'];

const PERSISTED_CALLS = new Set([
  'startChild',
  'executeChild',
  'continueAsNew',
  'signalExternalWorkflow',
  'upsertSearchAttributes',
  'setMemo',
]);

function isIdLike(name: string): boolean {
  const lower = name.toLowerCase();
  if (ID_KEYWORDS.includes(lower)) return true;

  if (lower.includes('_')) {
    const parts = lower.split('_');
    return parts.some((part) => ID_KEYWORDS.includes(part));
  }

  const match = name.match(/[A-Z][a-z0-9]*|[a-z0-9]+/g);
  if (!match) return false;
  return match.some((part) => ID_KEYWORDS.includes(part.toLowerCase()));
}

function getPropertyKeyName(node: TSESTree.Property['key']): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }
  return null;
}

export const preferLocalActivityForNondeterministicValue = createWorkflowRule<
  [],
  MessageIds
>({
  name: 'workflow-prefer-local-activity-for-nondeterministic-value',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Suggest generating nondeterministic IDs in a local activity when they must remain stable across code changes.',
    },
    messages: {
      preferLocalActivity:
        'Consider generating this nondeterministic value in a local activity so it stays stable across refactors and deployments.',
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

    function findPrngCall(node: TSESTree.Node): TSESTree.CallExpression | null {
      if (isPrngCall(node)) return node;

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              const found = findPrngCall(child as TSESTree.Node);
              if (found) return found;
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          const found = findPrngCall(value as TSESTree.Node);
          if (found) return found;
        }
      }

      return null;
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

    function isWithinPersistedCall(node: TSESTree.Node): boolean {
      const ancestors = sourceCode.getAncestors(node);
      for (const ancestor of ancestors) {
        if (
          ancestor.type === AST_NODE_TYPES.CallExpression &&
          isPersistedWorkflowCall(ancestor)
        ) {
          return true;
        }
      }
      return false;
    }

    function reportPrng(node: TSESTree.Node): void {
      context.report({ node, messageId: 'preferLocalActivity' });
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      VariableDeclarator(node) {
        if (node.init && node.init.type === AST_NODE_TYPES.CallExpression) {
          if (isProxyActivitiesCall(node.init)) {
            if (node.id.type === AST_NODE_TYPES.Identifier) {
              activityProxyVariables.add(node.id.name);
            } else if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
              for (const property of node.id.properties) {
                if (
                  property.type === AST_NODE_TYPES.Property &&
                  property.key.type === AST_NODE_TYPES.Identifier
                ) {
                  directActivityFns.add(property.key.name);
                }
              }
            }
          }
        }

        if (!node.init || node.id.type !== AST_NODE_TYPES.Identifier) return;
        if (!isIdLike(node.id.name)) return;

        ensureWorkflowImportsSeeded();
        const prngCall = findPrngCall(node.init);
        if (!prngCall) return;

        reportPrng(prngCall);
      },
      AssignmentExpression(node) {
        if (node.left.type !== AST_NODE_TYPES.Identifier) return;
        if (!isIdLike(node.left.name)) return;

        ensureWorkflowImportsSeeded();
        const prngCall = findPrngCall(node.right);
        if (!prngCall) return;

        reportPrng(prngCall);
      },
      Property(node) {
        if (node.parent?.type !== AST_NODE_TYPES.ObjectExpression) return;
        const keyName = getPropertyKeyName(node.key);
        if (!keyName || !isIdLike(keyName)) return;

        if (isWithinPersistedCall(node)) return;

        ensureWorkflowImportsSeeded();
        const prngCall = findPrngCall(node.value);
        if (!prngCall) return;

        reportPrng(prngCall);
      },
    };
  },
});
