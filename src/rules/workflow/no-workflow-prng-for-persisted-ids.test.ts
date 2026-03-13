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
      // Member expression: wf.proxyActivities - uuid4 used outside persisted call is fine
      `
        import * as wf from '@temporalio/workflow';
        const orderId = wf.uuid4();
        const activities = wf.proxyActivities<Activities>({ startToCloseTimeout: '1m' });
        await activities.createOrder({ id: orderId });
      `,
      // uuid4 not called as argument to a persisted call (just standalone)
      `
        import { uuid4 } from '@temporalio/workflow';
        const orderId = uuid4();
        log(orderId);
      `,
      // Non-uuid4 callee with same signature but different import name
      `
        import { uuid4 as generateId } from '@temporalio/workflow';
        const id = generateId();
        log(id);
      `,
      // Non-persisted call should not be checked
      `
        import { uuid4 } from '@temporalio/workflow';
        someRandomFunction(uuid4());
      `,
      // Destructured proxyActivities: calling destructured fn with static args is fine
      `
        const { createOrder } = proxyActivities({ startToCloseTimeout: '1m' });
        await createOrder({ id: 'static' });
      `,
      // Destructured proxyLocalActivities: calling destructured fn with static args is fine
      `
        const { compute } = proxyLocalActivities({ startToCloseTimeout: '1m' });
        await compute({ data: 42 });
      `,
      // proxyActivities assigned to Identifier
      `
        const activities = proxyActivities({ startToCloseTimeout: '1m' });
        await activities.createOrder({ id: 'static' });
      `,
      // Return containing a persisted call — the persisted call is skipped
      // by collectPrngCalls with skipPersistedCalls=true (covers lines 117-118)
      `
        const activities = proxyActivities({ startToCloseTimeout: '1m' });
        return activities.createOrder({ id: 'static' });
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
      // Bracket notation persisted call: wf['startChild'](...)
      {
        code: `
          import { uuid4 } from '@temporalio/workflow';
          import * as wf from '@temporalio/workflow';
          await wf['startChild'](childWorkflow, { workflowId: uuid4() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Member expression persisted call: wf.executeChild(...)
      {
        code: `
          import { uuid4 } from '@temporalio/workflow';
          import * as wf from '@temporalio/workflow';
          await wf.executeChild(childWorkflow, { workflowId: uuid4() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Namespace uuid4 in persisted call: wf.uuid4() in startChild
      {
        code: `
          import * as wf from '@temporalio/workflow';
          await wf.startChild(childWorkflow, { workflowId: wf.uuid4() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Renamed uuid4 import used in persisted call
      {
        code: `
          import { uuid4 as generateId, startChild } from '@temporalio/workflow';
          await startChild(childWorkflow, { workflowId: generateId() });
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Destructured proxyActivities: calling destructured fn with uuid4 as arg
      {
        code: `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const { createOrder } = proxyActivities({ startToCloseTimeout: '1m' });
          await createOrder(uuid4());
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Return statement with PRNG (no nested persisted call to skip)
      {
        code: `
          import { uuid4 } from '@temporalio/workflow';
          return { orderId: uuid4() };
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Math.random in return statement
      {
        code: `return { value: Math.random() };`,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // uuid4 used without importing from @temporalio/workflow
      // (uuid4LocalNames.size === 0 so falls through to callee.name === 'uuid4')
      {
        code: `startChild(childWorkflow, { workflowId: uuid4() });`,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
      // Return statement with nested persisted call AND top-level PRNG
      // (persisted call is skipped, but top-level PRNG is still found)
      {
        code: `
          return { extra: uuid4() };
        `,
        errors: [{ messageId: 'noWorkflowPrngForPersistedIds' }],
      },
    ],
  });
});
