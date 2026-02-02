import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireActivityRetryPolicy } from './require-activity-retry-policy.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-activity-retry-policy', () => {
  ruleTester.run('require-activity-retry-policy', requireActivityRetryPolicy, {
    valid: [
      // With retry policy
      `
        const activities = proxyActivities({
          startToCloseTimeout: '1m',
          retry: { maximumAttempts: 3 }
        });
      `,

      // With explicit no-retry
      `
        const activities = proxyActivities({
          startToCloseTimeout: '1m',
          retry: { maximumAttempts: 1 }
        });
      `,

      // Complex retry policy
      `
        const activities = proxyActivities({
          startToCloseTimeout: '1m',
          retry: {
            maximumAttempts: 5,
            initialInterval: '1s',
            backoffCoefficient: 2,
            maximumInterval: '30s',
          }
        });
      `,

      // proxyLocalActivities with retry
      `
        const localActivities = proxyLocalActivities({
          startToCloseTimeout: '1m',
          retry: { maximumAttempts: 3 }
        });
      `,

      // Options as variable (can't statically analyze)
      `
        const options = getActivityOptions();
        const activities = proxyActivities(options);
      `,

      // No arguments (separate concern - require-activity-timeouts)
      `const activities = proxyActivities();`,

      // Other function calls
      `const result = someOtherFunction({ noRetry: true });`,
    ],
    invalid: [
      // Missing retry in proxyActivities
      {
        code: `
          const activities = proxyActivities({
            startToCloseTimeout: '1m'
          });
        `,
        errors: [{ messageId: 'missingRetryPolicy' }],
      },

      // Missing retry in proxyLocalActivities
      {
        code: `
          const localActivities = proxyLocalActivities({
            startToCloseTimeout: '1m'
          });
        `,
        errors: [{ messageId: 'missingRetryPolicy' }],
      },

      // Has other options but no retry
      {
        code: `
          const activities = proxyActivities({
            startToCloseTimeout: '1m',
            scheduleToCloseTimeout: '5m',
            heartbeatTimeout: '30s'
          });
        `,
        errors: [{ messageId: 'missingRetryPolicy' }],
      },

      // Empty options object
      {
        code: `const activities = proxyActivities({});`,
        errors: [{ messageId: 'missingRetryPolicy' }],
      },

      // With taskQueue but no retry
      {
        code: `
          const activities = proxyActivities({
            taskQueue: 'my-queue',
            startToCloseTimeout: '1m'
          });
        `,
        errors: [{ messageId: 'missingRetryPolicy' }],
      },
    ],
  });
});
