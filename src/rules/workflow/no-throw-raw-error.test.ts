import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noThrowRawError } from './no-throw-raw-error.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-throw-raw-error', () => {
  ruleTester.run('no-throw-raw-error', noThrowRawError, {
    valid: [
      // Throwing ApplicationFailure
      `throw ApplicationFailure.nonRetryable('Something went wrong');`,
      `throw ApplicationFailure.create({ message: 'Failed' });`,

      // Throwing custom errors
      `throw new MyCustomError('message');`,
      `throw customError;`,

      // Re-throwing
      `throw err;`,
      `throw error;`,

      // Throwing literals (odd but valid)
      `throw 'error message';`,
      `throw { message: 'error' };`,
    ],
    invalid: [
      // new Error()
      {
        code: `throw new Error('Something went wrong');`,
        errors: [{ messageId: 'noThrowRawError' }],
      },

      // Error() without new
      {
        code: `throw Error('Something went wrong');`,
        errors: [{ messageId: 'noThrowRawError' }],
      },

      // TypeError
      {
        code: `throw new TypeError('Invalid type');`,
        errors: [{ messageId: 'noThrowRawError' }],
      },

      // RangeError
      {
        code: `throw new RangeError('Out of range');`,
        errors: [{ messageId: 'noThrowRawError' }],
      },

      // In function
      {
        code: `
          function processOrder() {
            if (!order.valid) {
              throw new Error('Invalid order');
            }
          }
        `,
        errors: [{ messageId: 'noThrowRawError' }],
      },

      // In async function
      {
        code: `
          async function workflow() {
            throw new Error('Workflow failed');
          }
        `,
        errors: [{ messageId: 'noThrowRawError' }],
      },
    ],
  });
});
