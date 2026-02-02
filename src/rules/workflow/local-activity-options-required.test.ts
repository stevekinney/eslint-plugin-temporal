import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { localActivityOptionsRequired } from './local-activity-options-required.ts';

const ruleTester = createWorkflowRuleTester();

describe('local-activity-options-required', () => {
  ruleTester.run('local-activity-options-required', localActivityOptionsRequired, {
    valid: [
      `
        const local = proxyLocalActivities({
          startToCloseTimeout: '1m',
          retry: { maximumAttempts: 3 }
        });
      `,
      `
        const local = proxyLocalActivities({
          scheduleToCloseTimeout: '2m',
          retry: { maximumAttempts: 1 }
        });
      `,
      `
        const options = getLocalActivityOptions();
        const local = proxyLocalActivities(options);
      `,
      `
        const activities = proxyActivities({ startToCloseTimeout: '1m' });
      `,
    ],
    invalid: [
      {
        code: `const local = proxyLocalActivities();`,
        errors: [
          {
            messageId: 'missingOptions',
            suggestions: [
              {
                messageId: 'addOptions',
                output: `const local = proxyLocalActivities({ startToCloseTimeout: '1 minute', retry: { maximumAttempts: 3 } });`,
              },
            ],
          },
        ],
      },
      {
        code: `const local = proxyLocalActivities({});`,
        errors: [
          {
            messageId: 'missingTimeoutAndRetry',
            suggestions: [
              {
                messageId: 'addTimeoutAndRetry',
                output: `const local = proxyLocalActivities({ startToCloseTimeout: '1 minute', retry: { maximumAttempts: 3 } });`,
              },
            ],
          },
        ],
      },
      {
        code: `
          const local = proxyLocalActivities({
            retry: { maximumAttempts: 2 }
          });
        `,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'addTimeout',
                output: `
          const local = proxyLocalActivities({ startToCloseTimeout: '1 minute',
            retry: { maximumAttempts: 2 }
          });
        `,
              },
            ],
          },
        ],
      },
      {
        code: `
          const local = proxyLocalActivities({
            startToCloseTimeout: '1m'
          });
        `,
        errors: [
          {
            messageId: 'missingRetry',
            suggestions: [
              {
                messageId: 'addRetry',
                output: `
          const local = proxyLocalActivities({ retry: { maximumAttempts: 3 },
            startToCloseTimeout: '1m'
          });
        `,
              },
            ],
          },
        ],
      },
    ],
  });
});
