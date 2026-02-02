import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { isNewError } from '../../utilities/ast-helpers.ts';
import { createActivityRule } from '../../utilities/create-context-rule.ts';
import { ensureImport } from '../../utilities/import-fixer.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'preferApplicationFailure' | 'useApplicationFailure';

export const preferApplicationFailure = createActivityRule<[], MessageIds>({
  name: 'activity-prefer-applicationfailure',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer throwing ApplicationFailure over raw Error in activities.',
    },
    hasSuggestions: true,
    messages: {
      preferApplicationFailure:
        'Consider throwing ApplicationFailure from @temporalio/common instead of raw Error. ApplicationFailure provides better control over retry behavior: use ApplicationFailure.nonRetryable() for permanent failures that should not be retried.',
      useApplicationFailure: 'Replace with ApplicationFailure.nonRetryable().',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function getErrorMessage(
      node:
        | import('@typescript-eslint/utils').TSESTree.NewExpression
        | import('@typescript-eslint/utils').TSESTree.CallExpression,
    ): string {
      const firstArg = node.arguments[0];
      if (!firstArg) return `'Activity failed'`;
      return sourceCode.getText(firstArg);
    }

    function reportError(
      node:
        | import('@typescript-eslint/utils').TSESTree.NewExpression
        | import('@typescript-eslint/utils').TSESTree.CallExpression,
    ): void {
      const message = getErrorMessage(node);

      context.report({
        node,
        messageId: 'preferApplicationFailure',
        suggest: [
          {
            messageId: 'useApplicationFailure',
            *fix(fixer) {
              yield fixer.replaceText(
                node,
                `ApplicationFailure.nonRetryable(${message})`,
              );
              yield* ensureImport(
                fixer,
                sourceCode,
                TEMPORAL_PACKAGES.common,
                'ApplicationFailure',
              );
            },
          },
        ],
      });
    }

    return {
      ThrowStatement(node) {
        const { argument } = node;

        if (!argument) {
          return;
        }

        // Check for `throw new Error(...)`
        if (isNewError(argument)) {
          reportError(
            argument as import('@typescript-eslint/utils').TSESTree.NewExpression,
          );
          return;
        }

        // Check for `throw Error(...)` (without new)
        if (
          argument.type === AST_NODE_TYPES.CallExpression &&
          argument.callee.type === AST_NODE_TYPES.Identifier &&
          isErrorConstructor(argument.callee.name)
        ) {
          reportError(argument);
        }
      },
    };
  },
});

function isErrorConstructor(name: string): boolean {
  const errorTypes = [
    'Error',
    'TypeError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'URIError',
    'EvalError',
  ];
  return errorTypes.includes(name);
}
