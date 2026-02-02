import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { isNewError } from '../../utilities/ast-helpers.ts';
import { createActivityRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'preferApplicationFailure';

export const preferApplicationFailure = createActivityRule<[], MessageIds>({
  name: 'activity-prefer-applicationfailure',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer throwing ApplicationFailure over raw Error in activities.',
    },
    messages: {
      preferApplicationFailure:
        'Consider throwing ApplicationFailure from @temporalio/common instead of raw Error. ApplicationFailure provides better control over retry behavior: use ApplicationFailure.nonRetryable() for permanent failures that should not be retried.',
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
            messageId: 'preferApplicationFailure',
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
            messageId: 'preferApplicationFailure',
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
