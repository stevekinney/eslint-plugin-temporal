import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'missingReturnType';

export const updateHandlerReturnType = createWorkflowRule<[], MessageIds>({
  name: 'workflow-update-handler-return-type',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit return type annotations on update handlers. Update handlers return values to the caller and should have explicit types for API clarity.',
    },
    messages: {
      missingReturnType:
        'Update handlers should have explicit return type annotations. Add a return type to make the update API contract clear to callers. Example: setHandler(myUpdate, (arg): Promise<string> => { ... })',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track defineUpdate calls to know which variables are update definitions
    const updateDefinitions = new Map<string, HandlerType>();

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

        // Check if the callback has a return type annotation
        if (!hasReturnTypeAnnotation(callback)) {
          context.report({
            node: callback,
            messageId: 'missingReturnType',
          });
        }
      },
    };
  },
});

function hasReturnTypeAnnotation(
  node: TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression,
): boolean {
  return node.returnType !== undefined;
}
