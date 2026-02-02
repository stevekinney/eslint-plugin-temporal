import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWorkflowPrngForPersistedIds } from './no-workflow-prng-for-persisted-ids.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-workflow-prng-for-persisted-ids', () => {
  ruleTester.run('no-workflow-prng-for-persisted-ids', noWorkflowPrngForPersistedIds, {
    valid: [
      `
        import { uuid4, proxyActivities } from '@temporalio/workflow';
        const orderId = uuid4();
        const activities = proxyActivities({ startToCloseTimeout: '1m' });
        await activities.createOrder({ id: orderId });
      `,
      `
        const activities = proxyActivities({ startToCloseTimeout: '1m' });
        await activities.createOrder({ id: 'static-id' });
      `,
      `
        const local = proxyLocalActivities({
          startToCloseTimeout: '1m',
          retry: { maximumAttempts: 3 }
        });
        await local.compute({ input: 1 });
      `,
    ],
    invalid: [
      {
        code: `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const activities = proxyActivities({ startToCloseTimeout: '1m' });
          await activities.createOrder({ id: uuid4() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      {
        code: `
          const activities = proxyActivities({ startToCloseTimeout: '1m' });
          await activities.createOrder({ id: Math.random() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      {
        code: `
          import { uuid4, startChild } from '@temporalio/workflow';
          await startChild(childWorkflow, { workflowId: uuid4() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      {
        code: `
          import { uuid4 } from '@temporalio/workflow';
          return { id: uuid4() };
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      {
        code: `
          import { uuid4, upsertSearchAttributes } from '@temporalio/workflow';
          upsertSearchAttributes({ OrderId: [uuid4()] });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
    ],
  });
});
