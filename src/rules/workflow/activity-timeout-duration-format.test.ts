import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { activityTimeoutDurationFormat } from './activity-timeout-duration-format.ts';

const ruleTester = createWorkflowRuleTester();

describe('activity-timeout-duration-format', () => {
  ruleTester.run('activity-timeout-duration-format', activityTimeoutDurationFormat, {
    valid: [
      // Default string format
      `const activities = proxyActivities({ startToCloseTimeout: '1m' });`,
      `const activities = proxyActivities({
        scheduleToCloseTimeout: '2m',
        heartbeatTimeout: '30s'
      });`,
      `const local = proxyLocalActivities({ scheduleToStartTimeout: '5m' });`,

      // Template literal string
      'const activities = proxyActivities({ startToCloseTimeout: `1m` });',

      // Custom number format
      {
        code: `const activities = proxyActivities({ startToCloseTimeout: 1000, scheduleToCloseTimeout: 2000 });`,
        options: [{ format: 'number' }],
      },

      // Non-literal values are ignored
      `const activities = proxyActivities({ startToCloseTimeout: timeoutMs });`,

      // Not a proxyActivities call
      `const result = makeActivities({ startToCloseTimeout: 1000 });`,
    ],
    invalid: [
      {
        code: `const activities = proxyActivities({ startToCloseTimeout: 1000 });`,
        errors: [{ messageId: 'timeoutFormat' }],
      },
      {
        code: `const local = proxyLocalActivities({ scheduleToCloseTimeout: '1m' });`,
        options: [{ format: 'number' }],
        errors: [{ messageId: 'timeoutFormat' }],
      },
    ],
  });
});
