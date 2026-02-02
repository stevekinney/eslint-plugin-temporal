import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noSetInterval';

export const noSetInterval = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-setinterval',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow setInterval() in workflow files. There is no deterministic equivalent in Temporal.',
    },
    messages: {
      noSetInterval:
        'Do not use setInterval() in workflows. setInterval has no deterministic Temporal equivalent and will break replays. Use a loop with sleep() instead: while (condition) { await sleep(duration); ... }',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check for setInterval() call
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'setInterval'
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noSetInterval',
        });
      },
    };
  },
});
