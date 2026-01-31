import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { isNewError } from '../../utilities/ast-helpers.ts';
import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noThrowRawError';

export const noThrowRawError = createRule<[], MessageIds>({
  name: 'no-throw-raw-error',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer throwing ApplicationFailure over raw Error in workflows.',
    },
    messages: {
      noThrowRawError:
        'Prefer throwing ApplicationFailure from @temporalio/common instead of raw Error. ApplicationFailure provides better control over retry behavior (use nonRetryable: true for permanent failures) and preserves error metadata across workflow boundaries.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        const { argument } = node;

        if (!argument) {
          return;
        }

        // Check for `throw new Error(...)`
        if (isNewError(argument)) {
          context.report({
            node: argument,
            messageId: 'noThrowRawError',
          });
          return;
        }

        // Check for `throw Error(...)` (without new)
        if (
          argument.type === AST_NODE_TYPES.CallExpression &&
          argument.callee.type === AST_NODE_TYPES.Identifier &&
          isErrorConstructor(argument.callee.name)
        ) {
          context.report({
            node: argument,
            messageId: 'noThrowRawError',
          });
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
