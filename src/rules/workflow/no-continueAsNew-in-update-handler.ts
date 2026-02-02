import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'noContinueAsNewInUpdateHandler';

export const noContinueAsNewInUpdateHandler = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-continueAsNew-in-update-handler',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling continueAsNew in update handlers. Continue-As-New from update handlers causes issues with the update lifecycle.',
    },
    messages: {
      noContinueAsNewInUpdateHandler:
        'Do not call continueAsNew() in an update handler. Continue-As-New terminates the current workflow execution, which will cause the update to fail. Instead, set a flag and call continueAsNew from the main workflow after the update completes.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track defineUpdate calls to know which variables are update definitions
    const updateDefinitions = new Map<string, HandlerType>();
    // Stack of whether we're currently inside an update handler
    const inUpdateHandler: boolean[] = [];

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
          updateDefinitions.set(node.id.name, HANDLER_DEFINITION_FUNCTIONS[funcName]);
        }
      },

      CallExpression(node) {
        // Check if we're inside an update handler and calling continueAsNew
        if (inUpdateHandler.length > 0 && inUpdateHandler[inUpdateHandler.length - 1]) {
          if (
            node.callee.type === AST_NODE_TYPES.Identifier &&
            node.callee.name === 'continueAsNew'
          ) {
            context.report({
              node,
              messageId: 'noContinueAsNewInUpdateHandler',
            });
          }
        }

        // Check if this is a setHandler call for an update
        if (!isSetHandlerCall(node)) {
          return;
        }

        const handlerType = getHandlerType(node, updateDefinitions);
        if (handlerType !== 'update') {
          return;
        }

        const callback = getHandlerCallback(node);
        if (!callback) {
          return;
        }

        // Can't analyze referenced functions statically
        if (callback.type === AST_NODE_TYPES.Identifier) {
          return;
        }
      },

      // Track entering and exiting functions that are update handler callbacks
      'CallExpression > ArrowFunctionExpression'(node: TSESTree.ArrowFunctionExpression) {
        const parent = node.parent;
        if (
          parent?.type === AST_NODE_TYPES.CallExpression &&
          isSetHandlerCall(parent) &&
          getHandlerType(parent, updateDefinitions) === 'update' &&
          parent.arguments[1] === node
        ) {
          inUpdateHandler.push(true);
        } else {
          inUpdateHandler.push(false);
        }
      },

      'CallExpression > ArrowFunctionExpression:exit'() {
        inUpdateHandler.pop();
      },

      'CallExpression > FunctionExpression'(node: TSESTree.FunctionExpression) {
        const parent = node.parent;
        if (
          parent?.type === AST_NODE_TYPES.CallExpression &&
          isSetHandlerCall(parent) &&
          getHandlerType(parent, updateDefinitions) === 'update' &&
          parent.arguments[1] === node
        ) {
          inUpdateHandler.push(true);
        } else {
          inUpdateHandler.push(false);
        }
      },

      'CallExpression > FunctionExpression:exit'() {
        inUpdateHandler.pop();
      },
    };
  },
});
