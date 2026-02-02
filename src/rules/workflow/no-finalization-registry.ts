import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noFinalizationRegistry';

export const noFinalizationRegistry = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-finalization-registry',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow FinalizationRegistry usage in workflows. FinalizationRegistry behavior is non-deterministic and breaks workflow replay.',
    },
    messages: {
      noFinalizationRegistry:
        'Do not use FinalizationRegistry in workflows. FinalizationRegistry callbacks are triggered by garbage collection, which is non-deterministic and will cause replay failures. Use explicit cleanup logic or workflow signals instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'FinalizationRegistry'
        ) {
          context.report({
            node,
            messageId: 'noFinalizationRegistry',
          });
        }
      },
      CallExpression(node) {
        // Also catch FinalizationRegistry() without new (though it would throw at runtime)
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'FinalizationRegistry'
        ) {
          context.report({
            node,
            messageId: 'noFinalizationRegistry',
          });
        }
      },
      Identifier(node) {
        // Catch references to FinalizationRegistry (e.g., assigning it to a variable)
        if (node.name !== 'FinalizationRegistry') {
          return;
        }

        // Skip if it's a property access (e.g., obj.FinalizationRegistry)
        if (
          node.parent?.type === AST_NODE_TYPES.MemberExpression &&
          node.parent.property === node
        ) {
          return;
        }

        // Skip if it's a property key (e.g., { FinalizationRegistry: value })
        if (
          node.parent?.type === AST_NODE_TYPES.Property &&
          node.parent.key === node &&
          !node.parent.computed
        ) {
          return;
        }

        // Skip if it's the callee of new/call expression (handled above)
        if (
          (node.parent?.type === AST_NODE_TYPES.NewExpression &&
            node.parent.callee === node) ||
          (node.parent?.type === AST_NODE_TYPES.CallExpression &&
            node.parent.callee === node)
        ) {
          return;
        }

        // Skip type annotations
        if (
          node.parent?.type === AST_NODE_TYPES.TSTypeReference ||
          node.parent?.type === AST_NODE_TYPES.TSTypeQuery
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noFinalizationRegistry',
        });
      },
    };
  },
});
