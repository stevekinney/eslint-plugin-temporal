import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'preferSleep';

export const preferSleep = createWorkflowRule<[], MessageIds>({
  name: 'workflow-prefer-sleep',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer sleep() from @temporalio/workflow over setTimeout(). Temporal sleep integrates with cancellation scopes.',
    },
    messages: {
      preferSleep:
        "Use sleep() from '@temporalio/workflow' instead of setTimeout(). Temporal's sleep() integrates with cancellation scopes and is the recommended way to delay execution in workflows.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check for setTimeout() call
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'setTimeout'
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'preferSleep',
        });
      },
    };
  },
});
