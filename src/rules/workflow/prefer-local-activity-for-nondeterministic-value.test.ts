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
        // Math.random without ID-like variable name
        `const jitter = Math.random();`,
        // uuid4 used in activity call - safe because activity stores value
        `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const activities = proxyActivities({ startToCloseTimeout: '1m' });
          await activities.createOrder({ orderId: uuid4() });
        `,
        // uuid4 without ID-like name - no warning
        `
          import { uuid4 } from '@temporalio/workflow';
          const value = uuid4();
        `,
        // Namespace import - uuid4 used safely
        `
          import * as wf from '@temporalio/workflow';
          const randomValue = wf.uuid4();
        `,
        // uuid4 in persisted call - safe
        `
          import { uuid4 } from '@temporalio/workflow';
          startChild('myWorkflow', { workflowId: uuid4() });
        `,
        // Math.random with non-ID variable name
        `const delay = Math.random() * 1000;`,
        // Destructured proxy activities - safe in activity call
        `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const { sendEmail } = proxyActivities({ startToCloseTimeout: '1m' });
          await sendEmail({ messageId: uuid4() });
        `,
      ],
      invalid: [
        // uuid4 in ID-like variable name
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Math.random with token-like name
        {
          code: `const token = Math.random();`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 in object property with ID-like key (not in persisted call)
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const payload = { workflowId: uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 via assignment expression
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            let userId;
            userId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Namespace import - uuid4 with ID-like name
        {
          code: `
            import * as wf from '@temporalio/workflow';
            const sessionId = wf.uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Math.random with ID-like suffix
        {
          code: `const userId = Math.random().toString(36);`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Object property with sessionId
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const data = { sessionId: uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // snake_case ID-like name
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const order_id = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Nested PRNG call in expression
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const requestId = 'prefix-' + uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
      ],
    },
  );
});
