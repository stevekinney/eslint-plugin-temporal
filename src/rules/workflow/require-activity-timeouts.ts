import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'missingTimeout' | 'missingStartToCloseTimeout';

const TIMEOUT_PROPERTIES = [
  'startToCloseTimeout',
  'scheduleToCloseTimeout',
  'scheduleToStartTimeout',
];

export const requireActivityTimeouts = createRule<[], MessageIds>({
  name: 'require-activity-timeouts',
  meta: {
    type: 'problem',
    docs: {
      description: 'Require timeout configuration when calling proxyActivities().',
    },
    messages: {
      missingTimeout:
        'proxyActivities() must specify at least one timeout (startToCloseTimeout or scheduleToCloseTimeout). Without timeouts, activities may run indefinitely.',
      missingStartToCloseTimeout:
        'Consider adding startToCloseTimeout to limit how long a single activity attempt can run.',
    },
    schema: [],
    hasSuggestions: true,
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isProxyActivitiesCall(node)) {
          return;
        }

        // Get the first argument (options object)
        const optionsArg = node.arguments[0];

        // No arguments at all
        if (!optionsArg) {
          const sourceCode = context.sourceCode;
          context.report({
            node,
            messageId: 'missingTimeout',
            suggest: [
              {
                messageId: 'missingStartToCloseTimeout',
                fix(fixer) {
                  // Get the opening paren
                  const openParen = sourceCode.getTokenAfter(
                    node.typeArguments ?? node.callee,
                    (token) => token.value === '(',
                  );
                  const closeParen = sourceCode.getLastToken(node);

                  if (!openParen || !closeParen) return null;

                  // Replace () with ({ ... })
                  return fixer.replaceTextRange(
                    [openParen.range[0], closeParen.range[1]],
                    `({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ })`,
                  );
                },
              },
            ],
          });
          return;
        }

        // Check if options is an object literal
        if (optionsArg.type === AST_NODE_TYPES.ObjectExpression) {
          const hasTimeout = TIMEOUT_PROPERTIES.some((prop) =>
            hasProperty(optionsArg, prop),
          );

          if (!hasTimeout) {
            context.report({
              node,
              messageId: 'missingTimeout',
              suggest: [
                {
                  messageId: 'missingStartToCloseTimeout',
                  fix(fixer) {
                    // Find position to insert (after opening brace)
                    const sourceCode = context.sourceCode;
                    const openBrace = sourceCode.getFirstToken(optionsArg);
                    if (!openBrace) return null;

                    // Check if there are existing properties
                    if (optionsArg.properties.length > 0) {
                      return fixer.insertTextAfter(
                        openBrace,
                        ` startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */,`,
                      );
                    } else {
                      return fixer.replaceText(
                        optionsArg,
                        `{ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ }`,
                      );
                    }
                  },
                },
              ],
            });
          }
        } else if (optionsArg.type === AST_NODE_TYPES.Identifier) {
          // Options passed as variable - we can't easily check statically
          // Consider this a potential issue but don't report without type info
          // In type-aware mode, we could trace the variable
        }
      },
    };
  },
});

/**
 * Check if a call expression is proxyActivities()
 */
function isProxyActivitiesCall(node: TSESTree.CallExpression): boolean {
  // Direct call: proxyActivities()
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'proxyActivities'
  ) {
    return true;
  }

  // Member expression: workflow.proxyActivities()
  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'proxyActivities'
  ) {
    return true;
  }

  return false;
}
