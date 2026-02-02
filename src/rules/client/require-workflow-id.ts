import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createClientRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'missingWorkflowId';

export const requireWorkflowId = createClientRule<[], MessageIds>({
  name: 'client-require-workflow-id',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require explicit workflowId when starting workflows to ensure idempotency.',
    },
    messages: {
      missingWorkflowId:
        'Workflow start options should include an explicit workflowId. Without it, retrying a failed client call may start duplicate workflows. Use a business-meaningful ID (e.g., orderId, userId) for idempotency.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check for client.workflow.start() or handle.start()
        if (!isWorkflowStartCall(node)) {
          return;
        }

        // The options are typically the second argument
        // client.workflow.start(workflowFn, { workflowId: '...' })
        const optionsArg = node.arguments[1];

        if (!optionsArg) {
          // No options provided at all
          context.report({
            node,
            messageId: 'missingWorkflowId',
          });
          return;
        }

        if (optionsArg.type === AST_NODE_TYPES.ObjectExpression) {
          if (!hasProperty(optionsArg, 'workflowId')) {
            context.report({
              node,
              messageId: 'missingWorkflowId',
            });
          }
        }
      },
    };
  },
});

/**
 * Check if a call expression is a workflow start call
 */
function isWorkflowStartCall(node: TSESTree.CallExpression): boolean {
  // Handle client.workflow.start() pattern
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    const { object, property } = node.callee;

    // Check for .start() method
    if (
      property.type === AST_NODE_TYPES.Identifier &&
      (property.name === 'start' || property.name === 'execute')
    ) {
      // Check if object is *.workflow (e.g., client.workflow.start)
      if (
        object.type === AST_NODE_TYPES.MemberExpression &&
        object.property.type === AST_NODE_TYPES.Identifier &&
        object.property.name === 'workflow'
      ) {
        return true;
      }

      // Check if object is workflowClient (e.g., workflowClient.start)
      if (
        object.type === AST_NODE_TYPES.Identifier &&
        (object.name.toLowerCase().includes('workflow') ||
          object.name.toLowerCase().includes('client'))
      ) {
        return true;
      }
    }

    // Handle signalWithStart pattern
    if (
      property.type === AST_NODE_TYPES.Identifier &&
      property.name === 'signalWithStart'
    ) {
      return true;
    }
  }

  return false;
}
