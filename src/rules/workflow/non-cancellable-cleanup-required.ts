import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'nonCancellableCleanupRequired';

const CANCELLATION_ERROR_TYPES = new Set([
  'CancelledFailure',
  'CanceledFailure',
  'CancellationError',
  'ActivityCancellationError',
]);

const CANCELLATION_CHECK_FUNCTIONS = new Set([
  'isCancellationError',
  'isCanceledError',
  'isCancelledError',
  'isCancellationFailure',
]);

function isCancellationCheck(node: TSESTree.Node): boolean {
  if (
    node.type === AST_NODE_TYPES.BinaryExpression &&
    node.operator === 'instanceof' &&
    node.right.type === AST_NODE_TYPES.Identifier
  ) {
    return CANCELLATION_ERROR_TYPES.has(node.right.name);
  }

  if (node.type === AST_NODE_TYPES.CallExpression) {
    if (node.callee.type === AST_NODE_TYPES.Identifier) {
      return CANCELLATION_CHECK_FUNCTIONS.has(node.callee.name);
    }
  }

  if (
    node.type === AST_NODE_TYPES.BinaryExpression &&
    (node.operator === '===' || node.operator === '==' || node.operator === '!==')
  ) {
    const left = node.left;
    const right = node.right;

    if (
      left.type === AST_NODE_TYPES.MemberExpression &&
      left.property.type === AST_NODE_TYPES.Identifier &&
      left.property.name === 'name' &&
      right.type === AST_NODE_TYPES.Literal &&
      typeof right.value === 'string'
    ) {
      return CANCELLATION_ERROR_TYPES.has(right.value);
    }
  }

  return false;
}

function containsCancellationCheck(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean {
  if (isCancellationCheck(node)) return true;

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          if (containsCancellationCheck(child as TSESTree.Node, sourceCode)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsCancellationCheck(value as TSESTree.Node, sourceCode)) {
        return true;
      }
    }
  }

  return false;
}

function containsAwait(node: TSESTree.Node, sourceCode: TSESLint.SourceCode): boolean {
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          if (containsAwait(child as TSESTree.Node, sourceCode)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAwait(value as TSESTree.Node, sourceCode)) {
        return true;
      }
    }
  }

  return false;
}

function containsNonCancellableCall(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean {
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'nonCancellable'
  ) {
    return true;
  }

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          if (containsNonCancellableCall(child as TSESTree.Node, sourceCode)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsNonCancellableCall(value as TSESTree.Node, sourceCode)) {
        return true;
      }
    }
  }

  return false;
}

export const nonCancellableCleanupRequired = createWorkflowRule<[], MessageIds>({
  name: 'workflow-non-cancellable-cleanup-required',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'When handling cancellation and running cleanup with await, require CancellationScope.nonCancellable().',
    },
    messages: {
      nonCancellableCleanupRequired:
        'This cancellation handler awaits cleanup work. Wrap cleanup in CancellationScope.nonCancellable() to avoid immediate cancellation while cleaning up.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CatchClause(node) {
        if (!containsCancellationCheck(node.body, sourceCode)) return;
        if (!containsAwait(node.body, sourceCode)) return;
        if (containsNonCancellableCall(node.body, sourceCode)) return;

        context.report({
          node,
          messageId: 'nonCancellableCleanupRequired',
        });
      },
    };
  },
});
