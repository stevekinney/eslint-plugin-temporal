import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'preferCancellationScopeWithTimeout';

const TIMEOUT_HELPERS = new Set(['sleep', 'condition']);

function isTimeoutCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return TIMEOUT_HELPERS.has(callee.name);
  }

  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return TIMEOUT_HELPERS.has(callee.property.name);
  }

  return false;
}

export const preferCancellationScopeWithTimeout = createWorkflowRule<[], MessageIds>({
  name: 'workflow-prefer-cancellation-scope-with-timeout',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer CancellationScope.withTimeout() over Promise.race() timeouts in workflows.',
    },
    messages: {
      preferCancellationScopeWithTimeout:
        'Prefer CancellationScope.withTimeout() instead of Promise.race() with sleep()/condition() for timeouts. CancellationScope integrates with Temporal cancellation semantics.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.object.type !== AST_NODE_TYPES.Identifier ||
          node.callee.object.name !== 'Promise' ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          node.callee.property.name !== 'race'
        ) {
          return;
        }

        const arg = node.arguments[0];
        if (!arg || arg.type !== AST_NODE_TYPES.ArrayExpression) {
          return;
        }

        const elements = arg.elements.filter(
          (element): element is TSESTree.Expression =>
            element !== null && element.type !== AST_NODE_TYPES.SpreadElement,
        );

        if (elements.length < 2) {
          return;
        }

        const hasTimeoutHelper = elements.some(
          (element) =>
            element.type === AST_NODE_TYPES.CallExpression && isTimeoutCall(element),
        );

        if (!hasTimeoutHelper) {
          return;
        }

        context.report({
          node,
          messageId: 'preferCancellationScopeWithTimeout',
        });
      },
    };
  },
});
