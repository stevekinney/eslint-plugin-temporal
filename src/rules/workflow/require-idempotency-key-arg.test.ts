import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireIdempotencyKeyArg } from './require-idempotency-key-arg.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-idempotency-key-arg', () => {
  ruleTester.run('require-idempotency-key-arg', requireIdempotencyKeyArg, {
    valid: [
      // Default idempotency key
      `const activities = proxyActivities();
       await activities.chargeCard({ idempotencyKey: 'abc', amount: 42 });`,

      // Workflow identifiers are allowed by default
      `const activities = proxyActivities();
       await activities.chargeCard({ workflowId, runId });`,

      // Non-matching activity name
      `const activities = proxyActivities();
       await activities.checkBalance({});`,

      // Destructured activity with idempotency key
      `const { sendEmail } = proxyActivities();
       await sendEmail({ idempotencyKey: 'mail-1' });`,

      // Custom key field
      {
        code: `const activities = proxyActivities();
               await activities.sendReceipt({ requestId: 'req-1' });`,
        options: [{ keyFields: ['requestId'] }],
      },

      // Non-object argument (can't statically analyze)
      `const activities = proxyActivities();
       await activities.chargeCard(payload);`,

      // Member expression: wf.proxyActivities with idempotency key
      `import * as wf from '@temporalio/workflow';
       const activities = wf.proxyActivities<Activities>({ startToCloseTimeout: '1m' });
       await activities.chargeCard({ idempotencyKey: 'abc', amount: 42 });`,

      // Member expression: wf.proxyLocalActivities with idempotency key (line 98)
      `import * as wf from '@temporalio/workflow';
       const activities = wf.proxyLocalActivities<Activities>({ startToCloseTimeout: '1m' });
       await activities.chargeCard({ idempotencyKey: 'abc', amount: 42 });`,

      // Bracket notation activity call with idempotency key (getActivityName Literal branch, lines 118-125)
      `const activities = proxyActivities();
       await activities['chargeCard']({ idempotencyKey: 'abc', amount: 42 });`,
    ],
    invalid: [
      {
        code: `const activities = proxyActivities();
               await activities.chargeCard({ amount: 42 });`,
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const activities = proxyActivities();
               await activities.chargeCard({ idempotencyKey: workflowInfo().workflowId, amount: 42 });`,
              },
            ],
          },
        ],
      },
      {
        code: `const { createInvoice } = proxyActivities();
               await createInvoice({ orderId: 'order-1' });`,
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const { createInvoice } = proxyActivities();
               await createInvoice({ idempotencyKey: workflowInfo().workflowId, orderId: 'order-1' });`,
              },
            ],
          },
        ],
      },
      {
        code: `const activities = proxyActivities();
               await activities.chargeCard({ workflowId, runId });`,
        options: [{ allowWorkflowIdentifiers: false }],
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const activities = proxyActivities();
               await activities.chargeCard({ idempotencyKey: workflowInfo().workflowId, workflowId, runId });`,
              },
            ],
          },
        ],
      },
      {
        code: `import * as wf from '@temporalio/workflow';
               const activities = wf.proxyActivities<Activities>({ startToCloseTimeout: '1m' });
               await activities.chargeCard({ amount: 42 });`,
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `import * as wf from '@temporalio/workflow';
               const activities = wf.proxyActivities<Activities>({ startToCloseTimeout: '1m' });
               await activities.chargeCard({ idempotencyKey: workflowInfo().workflowId, amount: 42 });`,
              },
            ],
          },
        ],
      },
      {
        code: `const activities = proxyActivities();
               await activities.processPayment({ amount: 10 });`,
        settings: {
          temporal: {
            activity: {
              idempotencyKeyApis: ['processPayment'],
            },
          },
        },
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const activities = proxyActivities();
               await activities.processPayment({ idempotencyKey: workflowInfo().workflowId, amount: 10 });`,
              },
            ],
          },
        ],
      },

      // Bracket notation activity call without idempotency key (getActivityName Literal branch, lines 118-125)
      {
        code: `const activities = proxyActivities();
               await activities['chargeCard']({ amount: 42 });`,
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const activities = proxyActivities();
               await activities['chargeCard']({ idempotencyKey: workflowInfo().workflowId, amount: 42 });`,
              },
            ],
          },
        ],
      },

      // Empty object argument — suggestion replaces entire object (lines 199-202)
      {
        code: `const activities = proxyActivities();
               await activities.chargeCard({});`,
        errors: [
          {
            messageId: 'missingIdempotencyKey',
            suggestions: [
              {
                messageId: 'addIdempotencyKey',
                output: `const activities = proxyActivities();
               await activities.chargeCard({ idempotencyKey: workflowInfo().workflowId });`,
              },
            ],
          },
        ],
      },
    ],
  });
});
