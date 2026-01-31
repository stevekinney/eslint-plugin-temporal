import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noWeakRef';

export const noWeakRef = createRule<[], MessageIds>({
  name: 'no-weakref',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow WeakRef usage in workflows. WeakRef behavior is non-deterministic and breaks workflow replay.',
    },
    messages: {
      noWeakRef:
        'Do not use WeakRef in workflows. WeakRef behavior depends on garbage collection timing, which is non-deterministic and will cause replay failures. Use regular references or workflow state instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'WeakRef'
        ) {
          context.report({
            node,
            messageId: 'noWeakRef',
          });
        }
      },
      CallExpression(node) {
        // Also catch WeakRef() without new (though it would throw at runtime)
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'WeakRef'
        ) {
          context.report({
            node,
            messageId: 'noWeakRef',
          });
        }
      },
      Identifier(node) {
        // Catch references to WeakRef (e.g., assigning it to a variable)
        if (node.name !== 'WeakRef') {
          return;
        }

        // Skip if it's a property access (e.g., obj.WeakRef)
        if (
          node.parent?.type === AST_NODE_TYPES.MemberExpression &&
          node.parent.property === node
        ) {
          return;
        }

        // Skip if it's a property key (e.g., { WeakRef: value })
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
          messageId: 'noWeakRef',
        });
      },
    };
  },
});
