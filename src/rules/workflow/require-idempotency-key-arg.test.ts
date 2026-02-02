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
    ],
  });
});
