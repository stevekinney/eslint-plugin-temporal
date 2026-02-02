import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'noWorkflowApisInQuery';

/**
 * Workflow APIs that cannot be called in query handlers
 */
const FORBIDDEN_WORKFLOW_APIS = new Set([
  // Activity invocation
  'proxyActivities',
  'proxyLocalActivities',
  // Timing/waiting
  'sleep',
  'condition',
  // Child workflows
  'startChild',
  'executeChild',
  // Continue as new
  'continueAsNew',
  // Timers
  'setHandler', // Can't register handlers inside a query
  // Patching
  'patched',
  'deprecatePatch',
  // Workflow control
  'getExternalWorkflowHandle',
  'makeContinueAsNewFunc',
]);

export const noWorkflowApisInQuery = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-workflow-apis-in-query',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow calling workflow APIs like proxyActivities, sleep, condition, etc. in query handlers. Query handlers must be pure reads.',
    },
    messages: {
      noWorkflowApisInQuery:
        'Cannot call {{ apiName }}() in a query handler. Query handlers must be pure reads and cannot trigger side effects, wait for conditions, or invoke activities. Move this logic to a signal or update handler.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track defineQuery calls to know which variables are query definitions
    const queryDefinitions = new Map<string, HandlerType>();
    // Stack of whether we're currently inside a query handler
    const inQueryHandler: boolean[] = [];

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
        // Check if we're inside a query handler and calling a forbidden API
        if (inQueryHandler.length > 0 && inQueryHandler[inQueryHandler.length - 1]) {
          if (node.callee.type === AST_NODE_TYPES.Identifier) {
            if (FORBIDDEN_WORKFLOW_APIS.has(node.callee.name)) {
              context.report({
                node,
                messageId: 'noWorkflowApisInQuery',
                data: {
                  apiName: node.callee.name,
                },
              });
            }
          }
        }

        // Check if this is a setHandler call for a query
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

        // Can't analyze referenced functions statically
        if (callback.type === AST_NODE_TYPES.Identifier) {
          return;
        }

        // Mark that we're entering a query handler - will be handled by function enter/exit
      },

      // Track entering and exiting functions that are query handler callbacks
      'CallExpression > ArrowFunctionExpression'(node: TSESTree.ArrowFunctionExpression) {
        const parent = node.parent;
        if (
          parent?.type === AST_NODE_TYPES.CallExpression &&
          isSetHandlerCall(parent) &&
          getHandlerType(parent, queryDefinitions) === 'query' &&
          parent.arguments[1] === node
        ) {
          inQueryHandler.push(true);
        } else {
          inQueryHandler.push(false);
        }
      },

      'CallExpression > ArrowFunctionExpression:exit'() {
        inQueryHandler.pop();
      },

      'CallExpression > FunctionExpression'(node: TSESTree.FunctionExpression) {
        const parent = node.parent;
        if (
          parent?.type === AST_NODE_TYPES.CallExpression &&
          isSetHandlerCall(parent) &&
          getHandlerType(parent, queryDefinitions) === 'query' &&
          parent.arguments[1] === node
        ) {
          inQueryHandler.push(true);
        } else {
          inQueryHandler.push(false);
        }
      },

      'CallExpression > FunctionExpression:exit'() {
        inQueryHandler.pop();
      },
    };
  },
});
