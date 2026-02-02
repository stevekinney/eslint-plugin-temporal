import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'awaitCancelRequested';

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

function containsNonCancellableCall(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): TSESTree.CallExpression[] {
  const matches: TSESTree.CallExpression[] = [];

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'nonCancellable'
  ) {
    matches.push(node);
  }

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          matches.push(...containsNonCancellableCall(child as TSESTree.Node, sourceCode));
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      matches.push(...containsNonCancellableCall(value as TSESTree.Node, sourceCode));
    }
  }

  return matches;
}

function containsCancelRequestedAwait(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean {
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    const arg = node.argument;
    if (
      arg &&
      arg.type === AST_NODE_TYPES.MemberExpression &&
      arg.property.type === AST_NODE_TYPES.Identifier &&
      arg.property.name === 'cancelRequested'
    ) {
      return true;
    }

    if (
      arg &&
      arg.type === AST_NODE_TYPES.CallExpression &&
      arg.callee.type === AST_NODE_TYPES.MemberExpression &&
      arg.callee.property.type === AST_NODE_TYPES.Identifier &&
      arg.callee.property.name === 'cancelRequested'
    ) {
      return true;
    }
  }

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    const value = (node as unknown as Record<string, unknown>)[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          if (containsCancelRequestedAwait(child as TSESTree.Node, sourceCode)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsCancelRequestedAwait(value as TSESTree.Node, sourceCode)) {
        return true;
      }
    }
  }

  return false;
}

export const awaitCancelRequestedInNonCancellablePattern = createWorkflowRule<
  [],
  MessageIds
>({
  name: 'workflow-await-cancel-requested-in-non-cancellable-pattern',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'When using CancellationScope.nonCancellable in cancellation handlers, suggest awaiting cancelRequested so the workflow reacts to cancellation.',
    },
    messages: {
      awaitCancelRequested:
        'This cancellation handler uses CancellationScope.nonCancellable. Consider awaiting CancellationScope.current().cancelRequested so the workflow reacts to cancellation before exiting.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CatchClause(node) {
        if (!containsCancellationCheck(node.body, sourceCode)) return;

        const nonCancellableCalls = containsNonCancellableCall(node.body, sourceCode);
        if (!nonCancellableCalls.length) return;

        if (containsCancelRequestedAwait(node.body, sourceCode)) return;

        for (const call of nonCancellableCalls) {
          context.report({
            node: call,
            messageId: 'awaitCancelRequested',
          });
        }
      },
    };
  },
});
