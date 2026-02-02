import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  isAsyncFunction,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'requireAllHandlersFinished';

/**
 * Check if a node contains a call to condition() with allHandlersFinished
 */
function containsAllHandlersFinishedCheck(node: TSESTree.Node): boolean {
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'condition'
  ) {
    // Check if any argument references allHandlersFinished
    for (const arg of node.arguments) {
      if (containsAllHandlersFinishedReference(arg)) {
        return true;
      }
    }
  }

  // Don't traverse into nested functions
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    // But do check the body of arrow functions used in condition()
    if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      if (containsAllHandlersFinishedReference(node.body)) {
        return true;
      }
    }
    return false;
  }

  // Check all child nodes
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          containsAllHandlersFinishedCheck(item as TSESTree.Node)
        ) {
          return true;
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAllHandlersFinishedCheck(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a node references allHandlersFinished
 */
function containsAllHandlersFinishedReference(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.Identifier && node.name === 'allHandlersFinished') {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'allHandlersFinished'
  ) {
    return true;
  }

  // Check all child nodes
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          containsAllHandlersFinishedReference(item as TSESTree.Node)
        ) {
          return true;
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAllHandlersFinishedReference(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

export const requireAllHandlersFinished = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-all-handlers-finished',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Suggest using condition(allHandlersFinished) before workflow completion when async handlers are present.',
    },
    messages: {
      requireAllHandlersFinished:
        "This workflow has async signal/update handlers but doesn't await condition(allHandlersFinished) before returning. Without this check, the workflow may complete while handlers are still running, causing lost work. Add: await condition(allHandlersFinished);",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    let hasAsyncHandler = false;
    let hasAllHandlersFinishedCheck = false;
    let workflowFunctionNode:
      | TSESTree.FunctionDeclaration
      | TSESTree.FunctionExpression
      | TSESTree.ArrowFunctionExpression
      | null = null;

    return {
      // Track setHandler calls with async callbacks
      CallExpression(node) {
        if (!isSetHandlerCall(node)) {
          return;
        }

        const callback = getHandlerCallback(node);
        if (!callback || callback.type === AST_NODE_TYPES.Identifier) {
          return;
        }

        if (isAsyncFunction(callback)) {
          hasAsyncHandler = true;
        }
      },

      // Track condition(allHandlersFinished) calls
      'CallExpression[callee.name="condition"]'(node: TSESTree.CallExpression) {
        for (const arg of node.arguments) {
          if (containsAllHandlersFinishedReference(arg)) {
            hasAllHandlersFinishedCheck = true;
          }
        }
      },

      // Track the main workflow function (exported function)
      'ExportNamedDeclaration > FunctionDeclaration'(node: TSESTree.FunctionDeclaration) {
        if (node.async) {
          workflowFunctionNode = node;
        }
      },

      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression'(
        node: TSESTree.ArrowFunctionExpression,
      ) {
        if (node.async) {
          workflowFunctionNode = node;
        }
      },

      'Program:exit'() {
        // If we have async handlers but no allHandlersFinished check, report on the workflow function
        if (hasAsyncHandler && !hasAllHandlersFinishedCheck && workflowFunctionNode) {
          // Check if the workflow function itself contains the check
          if (!containsAllHandlersFinishedCheck(workflowFunctionNode.body)) {
            context.report({
              node: workflowFunctionNode,
              messageId: 'requireAllHandlersFinished',
            });
          }
        }

        // Reset state for next file
        hasAsyncHandler = false;
        hasAllHandlersFinishedCheck = false;
        workflowFunctionNode = null;
      },
    };
  },
});
