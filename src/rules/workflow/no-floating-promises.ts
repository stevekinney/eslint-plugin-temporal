import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'floatingPromise';

// Methods that return promises and should be awaited
const ASYNC_WORKFLOW_METHODS = new Set([
  // Activity calls (from proxyActivities)
  // We can't know for sure, but any function call on a proxied object is likely async

  // Child workflow methods
  'executeChild',
  'startChild',

  // Timer methods
  'sleep',

  // Signal/query methods
  'setHandler',
  'condition',

  // Workflow methods
  'continueAsNew',
]);

export const noFloatingPromises = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-floating-promises',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow floating (unhandled) promises in workflows, especially for activity and child workflow calls.',
    },
    messages: {
      floatingPromise:
        'This {{ type }} call returns a Promise that is not awaited, returned, or stored. Unhandled promises in workflows can cause subtle bugs and make replay non-deterministic. Add `await` or assign to a variable.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ExpressionStatement(node) {
        const { expression } = node;

        // We're looking for call expressions that aren't awaited
        if (expression.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        // Check if this looks like an async workflow operation
        const callType = getAsyncCallType(expression);
        if (!callType) {
          return;
        }

        context.report({
          node: expression,
          messageId: 'floatingPromise',
          data: { type: callType },
        });
      },
    };
  },
});

/**
 * Determine if a call expression is likely an async workflow operation
 */
function getAsyncCallType(node: TSESTree.CallExpression): string | null {
  const { callee } = node;

  // Direct function call: sleep(), condition(), executeChild()
  if (callee.type === AST_NODE_TYPES.Identifier) {
    if (ASYNC_WORKFLOW_METHODS.has(callee.name)) {
      return callee.name;
    }
    return null;
  }

  // Member expression: activities.doSomething(), childWorkflow.execute()
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    const { object, property } = callee;

    // Get method name
    let methodName: string | undefined;
    if (property.type === AST_NODE_TYPES.Identifier) {
      methodName = property.name;
    }

    // Check for known async methods
    if (methodName && ASYNC_WORKFLOW_METHODS.has(methodName)) {
      return methodName;
    }

    // Check for activity proxy calls (activities.*)
    if (object.type === AST_NODE_TYPES.Identifier) {
      const objectName = object.name.toLowerCase();
      if (
        objectName.includes('activit') ||
        objectName.includes('proxy') ||
        objectName === 'acts'
      ) {
        return `activity (${methodName ?? 'unknown'})`;
      }
    }

    // Check for child workflow calls
    if (object.type === AST_NODE_TYPES.Identifier) {
      const objectName = object.name.toLowerCase();
      if (objectName.includes('child') || objectName.includes('workflow')) {
        return `child workflow (${methodName ?? 'unknown'})`;
      }
    }
  }

  return null;
}
