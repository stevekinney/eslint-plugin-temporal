import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'contextNotStored';

export const contextNotStored = createRule<[], MessageIds>({
  name: 'context-not-stored',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow storing Activity Context in variables that persist across async boundaries.',
    },
    messages: {
      contextNotStored:
        'Do not store Context.current() in a variable. The activity context uses AsyncLocalStorage and must be accessed via Context.current() each time it is needed. Storing it in a variable can lead to stale or incorrect context after async operations.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        // Check if the init is Context.current()
        if (!node.init || !isContextCurrentCall(node.init)) {
          return;
        }

        // Allow destructuring: const { cancellationSignal } = Context.current()
        // This is fine because we're extracting specific properties immediately
        if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
          return;
        }

        // Storing the result of Context.current() is problematic
        context.report({
          node,
          messageId: 'contextNotStored',
        });
      },

      AssignmentExpression(node) {
        // Check for assignment like `ctx = Context.current()`
        if (!isContextCurrentCall(node.right)) {
          return;
        }

        context.report({
          node,
          messageId: 'contextNotStored',
        });
      },
    };
  },
});

/**
 * Check if an expression is Context.current()
 */
function isContextCurrentCall(node: TSESTree.Expression): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }

  const { callee } = node;

  // Context.current()
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    callee.object.name === 'Context' &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'current'
  ) {
    return true;
  }

  return false;
}
