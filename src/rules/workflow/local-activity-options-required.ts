import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds =
  | 'missingOptions'
  | 'missingTimeout'
  | 'missingRetry'
  | 'missingTimeoutAndRetry'
  | 'addOptions'
  | 'addTimeout'
  | 'addRetry'
  | 'addTimeoutAndRetry';

const TIMEOUT_PROPERTIES = [
  'startToCloseTimeout',
  'scheduleToCloseTimeout',
  'scheduleToStartTimeout',
];

export const localActivityOptionsRequired = createWorkflowRule<[], MessageIds>({
  name: 'workflow-local-activity-options-required',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require proxyLocalActivities to configure explicit timeouts and a retry policy.',
    },
    hasSuggestions: true,
    messages: {
      missingOptions:
        'proxyLocalActivities() must include options with explicit timeouts and a retry policy.',
      missingTimeout:
        'proxyLocalActivities() must specify a timeout (startToCloseTimeout or scheduleToCloseTimeout).',
      missingRetry:
        'proxyLocalActivities() must specify a retry policy (retry: { ... }).',
      missingTimeoutAndRetry:
        'proxyLocalActivities() must specify timeouts and a retry policy.',
      addOptions: 'Add options with timeout and retry policy.',
      addTimeout: 'Add startToCloseTimeout.',
      addRetry: 'Add retry policy.',
      addTimeoutAndRetry: 'Add timeout and retry policy.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isProxyLocalActivitiesCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === 'proxyLocalActivities'
      ) {
        return true;
      }

      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        node.callee.property.name === 'proxyLocalActivities'
      ) {
        return true;
      }

      return false;
    }

    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        if (!isProxyLocalActivitiesCall(node)) return;

        const optionsArg = node.arguments[0];

        if (!optionsArg) {
          // No options at all - add full options object
          const openParen = sourceCode.getTokenAfter(
            node.typeArguments ?? node.callee,
            (token) => token.value === '(',
          );
          const closeParen = sourceCode.getLastToken(node);

          context.report({
            node,
            messageId: 'missingOptions',
            suggest: [
              {
                messageId: 'addOptions',
                fix(fixer) {
                  if (!openParen || !closeParen) return null;
                  return fixer.replaceTextRange(
                    [openParen.range[0], closeParen.range[1]],
                    `({ startToCloseTimeout: '1 minute', retry: { maximumAttempts: 3 } })`,
                  );
                },
              },
            ],
          });
          return;
        }

        if (optionsArg.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        const hasTimeout = TIMEOUT_PROPERTIES.some((prop) =>
          hasProperty(optionsArg, prop),
        );
        const hasRetry = hasProperty(optionsArg, 'retry');

        if (!hasTimeout && !hasRetry) {
          context.report({
            node: optionsArg,
            messageId: 'missingTimeoutAndRetry',
            suggest: [
              {
                messageId: 'addTimeoutAndRetry',
                fix(fixer) {
                  const openBrace = sourceCode.getFirstToken(optionsArg);
                  if (!openBrace) return null;

                  if (optionsArg.properties.length > 0) {
                    return fixer.insertTextAfter(
                      openBrace,
                      ` startToCloseTimeout: '1 minute', retry: { maximumAttempts: 3 },`,
                    );
                  } else {
                    return fixer.replaceText(
                      optionsArg,
                      `{ startToCloseTimeout: '1 minute', retry: { maximumAttempts: 3 } }`,
                    );
                  }
                },
              },
            ],
          });
          return;
        }

        if (!hasTimeout) {
          context.report({
            node: optionsArg,
            messageId: 'missingTimeout',
            suggest: [
              {
                messageId: 'addTimeout',
                fix(fixer) {
                  const openBrace = sourceCode.getFirstToken(optionsArg);
                  if (!openBrace) return null;

                  return fixer.insertTextAfter(
                    openBrace,
                    ` startToCloseTimeout: '1 minute',`,
                  );
                },
              },
            ],
          });
          return;
        }

        if (!hasRetry) {
          context.report({
            node: optionsArg,
            messageId: 'missingRetry',
            suggest: [
              {
                messageId: 'addRetry',
                fix(fixer) {
                  const openBrace = sourceCode.getFirstToken(optionsArg);
                  if (!openBrace) return null;

                  return fixer.insertTextAfter(
                    openBrace,
                    ` retry: { maximumAttempts: 3 },`,
                  );
                },
              },
            ],
          });
        }
      },
    };
  },
});
