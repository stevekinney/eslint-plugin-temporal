import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noProcessEnv';

export const noProcessEnv = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-process-env',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow process.env in workflow files. Environment variables cause replay divergence.',
    },
    messages: {
      noProcessEnv:
        'Do not use process.env in workflows. Environment variables may change between workflow execution and replay, causing non-determinism. Pass configuration through workflow arguments or use activities for environment access.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      MemberExpression(node) {
        // Check for process.env directly (e.g., process.env or process.env.X)
        // We only report on the process.env MemberExpression itself,
        // not on nested accesses like process.env.X (to avoid double reporting)
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          node.object.name === 'process' &&
          node.property.type === AST_NODE_TYPES.Identifier &&
          node.property.name === 'env'
        ) {
          context.report({
            node,
            messageId: 'noProcessEnv',
          });
        }
      },
    };
  },
});
