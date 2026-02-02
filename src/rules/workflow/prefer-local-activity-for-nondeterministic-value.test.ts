import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferLocalActivityForNondeterministicValue } from './prefer-local-activity-for-nondeterministic-value.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-local-activity-for-nondeterministic-value', () => {
  ruleTester.run(
    'prefer-local-activity-for-nondeterministic-value',
    preferLocalActivityForNondeterministicValue,
    {
      valid: [
        `const jitter = Math.random();`,
        `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const activities = proxyActivities({ startToCloseTimeout: '1m' });
          await activities.createOrder({ orderId: uuid4() });
        `,
        `
          import { uuid4 } from '@temporalio/workflow';
          const value = uuid4();
        `,
      ],
      invalid: [
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        {
          code: `const token = Math.random();`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const payload = { workflowId: uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            let userId;
            userId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
      ],
    },
  );
});
