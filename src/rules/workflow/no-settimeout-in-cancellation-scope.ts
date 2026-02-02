import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noSetTimeoutInCancellationScope';

type FunctionLike = TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression;

const CANCELLATION_SCOPE_METHODS = new Set([
  'withTimeout',
  'nonCancellable',
  'cancellable',
  'withCancel',
]);

function isCancellationScopeCall(node: TSESTree.CallExpression): boolean {
  if (
    node.callee.type !== AST_NODE_TYPES.MemberExpression ||
    node.callee.property.type !== AST_NODE_TYPES.Identifier
  ) {
    return false;
  }

  if (!CANCELLATION_SCOPE_METHODS.has(node.callee.property.name)) {
    return false;
  }

  if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
    return node.callee.object.name === 'CancellationScope';
  }

  if (
    node.callee.object.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.object.property.name === 'CancellationScope';
  }

  return false;
}

function isCancellationScopeCallback(node: FunctionLike): boolean {
  const parent = node.parent;
  if (!parent || parent.type !== AST_NODE_TYPES.CallExpression) return false;
  if (!isCancellationScopeCall(parent)) return false;
  return parent.arguments.includes(node);
}

export const noSetTimeoutInCancellationScope = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-settimeout-in-cancellation-scope',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow setTimeout inside CancellationScope callbacks. Use sleep() for workflow-aware timers.',
    },
    messages: {
      noSetTimeoutInCancellationScope:
        'Avoid setTimeout() inside CancellationScope callbacks. Use sleep() so timers respect workflow cancellation.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isInsideCancellationScopeCallback(node: TSESTree.Node): boolean {
      const ancestors = context.sourceCode.getAncestors(node);
      return ancestors.some(
        (ancestor) =>
          (ancestor.type === AST_NODE_TYPES.FunctionExpression ||
            ancestor.type === AST_NODE_TYPES.ArrowFunctionExpression) &&
          isCancellationScopeCallback(ancestor),
      );
    }

    function isSetTimeoutCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return callee.name === 'setTimeout';
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return callee.property.name === 'setTimeout';
      }

      return false;
    }

    return {
      CallExpression(node) {
        if (!isSetTimeoutCall(node)) return;
        if (!isInsideCancellationScopeCallback(node)) return;

        context.report({
          node,
          messageId: 'noSetTimeoutInCancellationScope',
        });
      },
    };
  },
});
