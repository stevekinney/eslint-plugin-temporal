import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'preferCondition';

export const preferConditionOverPolling = createWorkflowRule<[], MessageIds>({
  name: 'workflow-prefer-condition-over-polling',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Suggest using condition() instead of polling loops with sleep(). Condition is more efficient and results in cleaner workflow history.',
    },
    messages: {
      preferCondition:
        'Consider using condition() instead of a polling loop with sleep(). Condition waits efficiently until a predicate becomes true: `await condition(() => state.ready)`. This produces cleaner workflow history and is more idiomatic.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isSleepCall(node: TSESTree.Node): boolean {
      return (
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === 'sleep'
      );
    }

    function hasAwaitSleep(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.AwaitExpression && isSleepCall(node.argument)) {
        return true;
      }

      // Check expression statement with await
      if (
        node.type === AST_NODE_TYPES.ExpressionStatement &&
        node.expression.type === AST_NODE_TYPES.AwaitExpression &&
        isSleepCall(node.expression.argument)
      ) {
        return true;
      }

      return false;
    }

    function containsAwaitSleep(body: TSESTree.Statement[]): boolean {
      for (const statement of body) {
        if (hasAwaitSleep(statement)) {
          return true;
        }

        // Check inside blocks
        if (
          statement.type === AST_NODE_TYPES.BlockStatement &&
          containsAwaitSleep(statement.body)
        ) {
          return true;
        }

        // Check inside if statements
        if (statement.type === AST_NODE_TYPES.IfStatement) {
          if (
            statement.consequent.type === AST_NODE_TYPES.BlockStatement &&
            containsAwaitSleep(statement.consequent.body)
          ) {
            return true;
          }
          if (
            statement.alternate?.type === AST_NODE_TYPES.BlockStatement &&
            containsAwaitSleep(statement.alternate.body)
          ) {
            return true;
          }
        }
      }

      return false;
    }

    function isPollingPattern(node: TSESTree.WhileStatement): boolean {
      // Check for while (true), while (1), or while (condition)
      // where the body contains await sleep()

      const body =
        node.body.type === AST_NODE_TYPES.BlockStatement ? node.body.body : [node.body];

      return containsAwaitSleep(body);
    }

    return {
      WhileStatement(node) {
        if (isPollingPattern(node)) {
          context.report({
            node,
            messageId: 'preferCondition',
          });
        }
      },

      // Also check do-while loops
      DoWhileStatement(node) {
        const body =
          node.body.type === AST_NODE_TYPES.BlockStatement ? node.body.body : [node.body];

        if (containsAwaitSleep(body)) {
          context.report({
            node,
            messageId: 'preferCondition',
          });
        }
      },
    };
  },
});
