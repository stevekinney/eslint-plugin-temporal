import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  hasReturnValue,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'signalMustReturnVoid';

export const signalHandlerReturnsVoid = createRule<[], MessageIds>({
  name: 'signal-handler-returns-void',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Signal handlers must return void. Return values from signal handlers are ignored.',
    },
    messages: {
      signalMustReturnVoid:
        'Signal handlers must return void. Any return value from a signal handler is ignored by Temporal. If you need to return a value, use an update handler instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track defineSignal calls to know which variables are signal definitions
    const signalDefinitions = new Map<string, HandlerType>();

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
          signalDefinitions.set(node.id.name, HANDLER_DEFINITION_FUNCTIONS[funcName]);
        }
      },

      CallExpression(node) {
        if (!isSetHandlerCall(node)) {
          return;
        }

        const handlerType = getHandlerType(node, signalDefinitions);
        if (handlerType !== 'signal') {
          return;
        }

        const callback = getHandlerCallback(node);
        if (!callback) {
          return;
        }

        // Check if callback is a function reference (identifier)
        if (callback.type === AST_NODE_TYPES.Identifier) {
          // Can't statically analyze referenced function
          return;
        }

        // Check if the handler returns a value
        if (hasReturnValue(callback)) {
          context.report({
            node: callback,
            messageId: 'signalMustReturnVoid',
          });
        }
      },
    };
  },
});
