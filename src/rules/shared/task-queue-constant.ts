import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'taskQueueShouldBeConstant';

export const taskQueueConstant = createRule<[], MessageIds>({
  name: 'task-queue-constant',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest using a constant for task queue names to ensure consistency.',
    },
    messages: {
      taskQueueShouldBeConstant:
        'Task queue name should be a constant or imported value, not a string literal. Using constants ensures consistency between workers and clients and makes refactoring safer.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node) {
        // Check for taskQueue property
        if (
          node.key.type !== AST_NODE_TYPES.Identifier ||
          node.key.name !== 'taskQueue'
        ) {
          return;
        }

        // Check if value is a string literal
        if (
          node.value.type === AST_NODE_TYPES.Literal &&
          typeof node.value.value === 'string'
        ) {
          context.report({
            node: node.value,
            messageId: 'taskQueueShouldBeConstant',
          });
        }

        // Also check template literals without expressions
        if (
          node.value.type === AST_NODE_TYPES.TemplateLiteral &&
          node.value.expressions.length === 0
        ) {
          context.report({
            node: node.value,
            messageId: 'taskQueueShouldBeConstant',
          });
        }
      },
    };
  },
});
