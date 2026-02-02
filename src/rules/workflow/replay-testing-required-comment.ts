import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'replayTestedCommentRequired';

const REPLAY_COMMENT_PATTERN = /replay[- ]tested/i;
const REPLAY_TRIGGER_FUNCTIONS = new Set(['patched', 'deprecatePatch', 'continueAsNew']);

function getCalleeName(node: TSESTree.CallExpression): string | null {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name;
  }

  return null;
}

export const replayTestingRequiredComment = createWorkflowRule<[], MessageIds>({
  name: 'workflow-replay-testing-required-comment',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a replay-tested comment when workflow versioning logic is changed.',
    },
    messages: {
      replayTestedCommentRequired:
        'Add a replay-tested comment (for example: // replay-tested: 2025-02-02) when changing workflow versioning logic to confirm replay coverage.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    let hasVersioningChange = false;
    let firstNode: TSESTree.Node | null = null;

    return {
      CallExpression(node) {
        const name = getCalleeName(node);
        if (!name || !REPLAY_TRIGGER_FUNCTIONS.has(name)) {
          return;
        }

        hasVersioningChange = true;
        if (!firstNode) {
          firstNode = node;
        }
      },

      'Program:exit'(node) {
        if (!hasVersioningChange) {
          return;
        }

        const hasReplayComment = sourceCode
          .getAllComments()
          .some((comment) => REPLAY_COMMENT_PATTERN.test(comment.value));

        if (hasReplayComment) {
          return;
        }

        context.report({
          node: firstNode ?? node,
          messageId: 'replayTestedCommentRequired',
        });
      },
    };
  },
});
