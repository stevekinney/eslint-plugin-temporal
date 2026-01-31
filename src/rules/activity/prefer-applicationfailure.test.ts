import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferApplicationFailure } from './prefer-applicationfailure.ts';

const ruleTester = createBasicRuleTester();

describe('prefer-applicationfailure', () => {
  ruleTester.run('prefer-applicationfailure', preferApplicationFailure, {
    valid: [
      // ApplicationFailure
      `throw ApplicationFailure.nonRetryable('Permanent failure');`,
      `throw ApplicationFailure.create({ message: 'Error', nonRetryable: true });`,

      // Custom errors
      `throw new MyCustomError('message');`,

      // Re-throwing
      `throw err;`,
      `throw error;`,
    ],
    invalid: [
      {
        code: `throw new Error('Activity failed');`,
        errors: [{ messageId: 'preferApplicationFailure' }],
      },
      {
        code: `throw Error('Activity failed');`,
        errors: [{ messageId: 'preferApplicationFailure' }],
      },
      {
        code: `throw new TypeError('Invalid input');`,
        errors: [{ messageId: 'preferApplicationFailure' }],
      },
    ],
  });
});
