import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noSharedArrayBuffer' | 'noAtomics';

export const noSharedArrayBuffer = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-shared-array-buffer',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow SharedArrayBuffer and Atomics in workflows. Shared memory is non-deterministic and breaks workflow replay.',
    },
    messages: {
      noSharedArrayBuffer:
        'Do not use SharedArrayBuffer in workflows. Shared memory between threads is non-deterministic — replay cannot guarantee the same interleaving. Use regular ArrayBuffer or workflow state instead.',
      noAtomics:
        'Do not use Atomics in workflows. Atomic operations on shared memory are non-deterministic and will cause replay failures.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'SharedArrayBuffer'
        ) {
          context.report({
            node,
            messageId: 'noSharedArrayBuffer',
          });
        }
      },
      MemberExpression(node) {
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === 'Atomics'
        ) {
          context.report({
            node,
            messageId: 'noAtomics',
          });
        }
      },
      Identifier(node) {
        if (node.name !== 'SharedArrayBuffer' && node.name !== 'Atomics') {
          return;
        }

        // Skip property access (e.g., obj.SharedArrayBuffer)
        if (
          node.parent?.type === AST_NODE_TYPES.MemberExpression &&
          node.parent.property === node
        ) {
          return;
        }

        // Skip property key (e.g., { SharedArrayBuffer: value })
        if (
          node.parent?.type === AST_NODE_TYPES.Property &&
          node.parent.key === node &&
          !node.parent.computed
        ) {
          return;
        }

        // Skip if callee of new expression (handled above)
        if (
          node.parent?.type === AST_NODE_TYPES.NewExpression &&
          node.parent.callee === node
        ) {
          return;
        }

        // Skip if object of member expression (handled above for Atomics)
        if (
          node.parent?.type === AST_NODE_TYPES.MemberExpression &&
          node.parent.object === node
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

        const messageId = node.name === 'Atomics' ? 'noAtomics' : 'noSharedArrayBuffer';

        context.report({
          node,
          messageId,
        });
      },
    };
  },
});
