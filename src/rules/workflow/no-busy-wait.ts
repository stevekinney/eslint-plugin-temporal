import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noBusyWait';

/**
 * Check if a node or any of its children contains an await expression
 */
function containsAwait(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return true;
  }

  // Don't traverse into nested functions/arrow functions (they have their own async context)
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  // Check all properties that could contain child nodes
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
          containsAwait(item as TSESTree.Node)
        ) {
          return true;
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAwait(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if the loop body is empty or near-empty (only a busy-wait pattern)
 */
function isEmptyOrTrivialBody(body: TSESTree.Statement): boolean {
  if (body.type === AST_NODE_TYPES.EmptyStatement) {
    return true;
  }

  if (body.type === AST_NODE_TYPES.BlockStatement && body.body.length === 0) {
    return true;
  }

  return false;
}

export const noBusyWait = createRule<[], MessageIds>({
  name: 'no-busy-wait',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow loops without await that could block the workflow task. Use condition() or sleep() for waiting.',
    },
    messages: {
      noBusyWait:
        'Avoid loops that wait without yielding. This loop has no await and may block the workflow task, causing timeouts. Use condition() to wait for state changes or sleep() to add delays.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    /**
     * Check if a loop appears to be a busy-wait pattern
     * Only flag truly problematic patterns:
     * 1. Infinite loops (while(true), for(;;)) without await
     * 2. Empty loop bodies
     */
    function checkLoop(
      node: TSESTree.WhileStatement | TSESTree.DoWhileStatement | TSESTree.ForStatement,
    ) {
      const body = node.body;

      // Check if the loop body contains any await expressions
      if (containsAwait(body)) {
        return; // Loop properly yields, not a busy wait
      }

      // Empty loop bodies are always problematic
      if (isEmptyOrTrivialBody(body)) {
        context.report({
          node,
          messageId: 'noBusyWait',
        });
        return;
      }

      // Only flag infinite loops without await
      // while(true) or for(;;) without await is problematic
      if (node.type === AST_NODE_TYPES.WhileStatement) {
        const test = node.test;
        if (test.type === AST_NODE_TYPES.Literal && test.value === true) {
          context.report({
            node,
            messageId: 'noBusyWait',
          });
        }
      }
    }

    return {
      WhileStatement: checkLoop,
      DoWhileStatement: checkLoop,
      ForStatement(node) {
        // For infinite loops: for(;;)
        if (!node.test) {
          if (!containsAwait(node.body)) {
            context.report({
              node,
              messageId: 'noBusyWait',
            });
          }
        } else {
          checkLoop(node);
        }
      },
    };
  },
});
