import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  containsMutation,
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'noQueryMutation';

export const noQueryMutation = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-query-mutation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow state mutations in query handlers. Query handlers must be pure reads.',
    },
    messages: {
      noQueryMutation:
        'Query handlers must be pure reads and cannot mutate state. State mutations in query handlers cause replay divergence because queries can be called at any time during replay. Move mutations to signal or update handlers.',
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
          // Can't statically analyze referenced function
          return;
        }

        // Get the function body
        const body = callback.body;

        // Collect parameters as local variables (they can be reassigned)
        const localVars = new Set<string>();
        for (const param of callback.params) {
          if (param.type === AST_NODE_TYPES.Identifier) {
            localVars.add(param.name);
          }
        }

        // Check for mutations in the handler body
        if (containsMutation(body, localVars)) {
          context.report({
            node: callback,
            messageId: 'noQueryMutation',
          });
        }
      },
    };
  },
});
