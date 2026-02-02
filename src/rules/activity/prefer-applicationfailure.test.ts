import { describe } from 'bun:test';

import { createActivityRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferApplicationFailure } from './prefer-applicationfailure.ts';

const ruleTester = createActivityRuleTester();

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
        errors: [
          {
            messageId: 'preferApplicationFailure',
            suggestions: [
              {
                messageId: 'useApplicationFailure',
                output: `import { ApplicationFailure } from '@temporalio/common';
throw ApplicationFailure.nonRetryable('Activity failed');`,
              },
            ],
          },
        ],
      },
      {
        code: `throw Error('Activity failed');`,
        errors: [
          {
            messageId: 'preferApplicationFailure',
            suggestions: [
              {
                messageId: 'useApplicationFailure',
                output: `import { ApplicationFailure } from '@temporalio/common';
throw ApplicationFailure.nonRetryable('Activity failed');`,
              },
            ],
          },
        ],
      },
      {
        code: `throw new TypeError('Invalid input');`,
        errors: [
          {
            messageId: 'preferApplicationFailure',
            suggestions: [
              {
                messageId: 'useApplicationFailure',
                output: `import { ApplicationFailure } from '@temporalio/common';
throw ApplicationFailure.nonRetryable('Invalid input');`,
              },
            ],
          },
        ],
      },
      // Test with existing import
      {
        code: `import { Context } from '@temporalio/activity';
throw new Error('Oops');`,
        errors: [
          {
            messageId: 'preferApplicationFailure',
            suggestions: [
              {
                messageId: 'useApplicationFailure',
                output: `import { Context } from '@temporalio/activity';
import { ApplicationFailure } from '@temporalio/common';
throw ApplicationFailure.nonRetryable('Oops');`,
              },
            ],
          },
        ],
      },
    ],
  });
});
