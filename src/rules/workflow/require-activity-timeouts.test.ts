import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireActivityTimeouts } from './require-activity-timeouts.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-activity-timeouts', () => {
  ruleTester.run('require-activity-timeouts', requireActivityTimeouts, {
    valid: [
      // With startToCloseTimeout
      `const activities = proxyActivities({ startToCloseTimeout: '1 minute' });`,
      `const activities = proxyActivities({ startToCloseTimeout: '5m' });`,

      // With scheduleToCloseTimeout
      `const activities = proxyActivities({ scheduleToCloseTimeout: '1 hour' });`,

      // With both
      `const activities = proxyActivities({
        startToCloseTimeout: '1 minute',
        scheduleToCloseTimeout: '1 hour'
      });`,

      // With scheduleToStartTimeout (less common but valid)
      `const activities = proxyActivities({
        scheduleToStartTimeout: '5 minutes',
        startToCloseTimeout: '1 minute'
      });`,

      // With type parameter
      `const activities = proxyActivities<typeof acts>({ startToCloseTimeout: '1m' });`,

      // With other options
      `const activities = proxyActivities({
        startToCloseTimeout: '1m',
        retry: { maximumAttempts: 3 }
      });`,

      // Member expression call (workflow.proxyActivities)
      `const activities = workflow.proxyActivities({ startToCloseTimeout: '1m' });`,

      // Not proxyActivities
      `const result = someOtherFunction({});`,
      `const result = doSomething();`,
    ],
    invalid: [
      // No arguments
      {
        code: `const activities = proxyActivities();`,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `const activities = proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ });`,
              },
            ],
          },
        ],
      },

      // Empty options object
      {
        code: `const activities = proxyActivities({});`,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `const activities = proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ });`,
              },
            ],
          },
        ],
      },

      // Options without timeout
      {
        code: `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });`,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `const activities = proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */, retry: { maximumAttempts: 3 } });`,
              },
            ],
          },
        ],
      },

      // With type parameter but no timeout
      {
        code: `const activities = proxyActivities<typeof acts>({});`,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `const activities = proxyActivities<typeof acts>({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ });`,
              },
            ],
          },
        ],
      },

      // Member expression without timeout
      {
        code: `const activities = workflow.proxyActivities({});`,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `const activities = workflow.proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ });`,
              },
            ],
          },
        ],
      },

      // Multiple activities calls, all missing timeouts
      {
        code: `
          const a1 = proxyActivities({});
          const a2 = proxyActivities({ retry: {} });
        `,
        errors: [
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `
          const a1 = proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */ });
          const a2 = proxyActivities({ retry: {} });
        `,
              },
            ],
          },
          {
            messageId: 'missingTimeout',
            suggestions: [
              {
                messageId: 'missingStartToCloseTimeout',
                output: `
          const a1 = proxyActivities({});
          const a2 = proxyActivities({ startToCloseTimeout: '1 minute' /* TODO: set appropriate timeout */, retry: {} });
        `,
              },
            ],
          },
        ],
      },
    ],
  });
});
