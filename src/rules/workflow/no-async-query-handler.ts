import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isAsyncFunction,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'noAsyncQueryHandler';

export const noAsyncQueryHandler = createRule<[], MessageIds>({
  name: 'no-async-query-handler',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow async query handlers. Query handlers must be synchronous per Temporal SDK contract.',
    },
    messages: {
      noAsyncQueryHandler:
        'Query handlers cannot be async. Query handlers must return their result synchronously. If you need to perform async operations, consider using a signal/update handler or an activity instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track defineQuery calls to know which variables are query definitions
    const queryDefinitions = new Map<string, HandlerType>();

    return {
      // Track defineQuery/defineSignal/defineUpdate variable assignments
      VariableDeclarator(node) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          node.init.type !== AST_NODE_TYPES.CallExpression
        ) {
          return;
        }

        const call = node.init;
        if (call.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const funcName = call.callee.name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
        if (funcName in HANDLER_DEFINITION_FUNCTIONS) {
          queryDefinitions.set(node.id.name, HANDLER_DEFINITION_FUNCTIONS[funcName]);
        }
      },

      CallExpression(node) {
        if (!isSetHandlerCall(node)) {
          return;
        }

        const handlerType = getHandlerType(node, queryDefinitions);
        if (handlerType !== 'query') {
          return;
        }

        const callback = getHandlerCallback(node);
        if (!callback) {
          return;
        }

        // Check if callback is a function reference (identifier)
        if (callback.type === AST_NODE_TYPES.Identifier) {
          // Can't statically determine if referenced function is async
          // Could potentially look up the function definition, but skip for now
          return;
        }

        // Check if the callback is async
        if (isAsyncFunction(callback)) {
          context.report({
            node: callback,
            messageId: 'noAsyncQueryHandler',
          });
        }
      },
    };
  },
});
