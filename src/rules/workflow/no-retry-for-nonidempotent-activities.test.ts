import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noRetryForNonIdempotentActivities } from './no-retry-for-nonidempotent-activities.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-retry-for-nonidempotent-activities', () => {
  ruleTester.run(
    'no-retry-for-nonidempotent-activities',
    noRetryForNonIdempotentActivities,
    {
      valid: [
        // Non-idempotent activity with explicit maxAttempts: 1
        `const activities = proxyActivities({ retry: { maximumAttempts: 1 } });
         await activities.chargeCard();`,

        // Non-idempotent activity with string literal maximumAttempts
        `const activities = proxyActivities({ retry: { maximumAttempts: '1' } });
         await activities.sendEmail();`,

        // Non-matching activity name
        `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
         await activities.checkBalance();`,

        // Unknown options (can't statically analyze)
        `const activities = proxyActivities(getOptions());
         await activities.chargeCard();`,

        // Destructured activity with explicit maxAttempts: 1
        `const { createInvoice } = proxyActivities({ retry: { maximumAttempts: 1 } });
         await createInvoice();`,

        // Member expression: wf.proxyActivities with retry maxAttempts: 1
        `import * as wf from '@temporalio/workflow';
         const activities = wf.proxyActivities<Activities>({ retry: { maximumAttempts: 1 } });
         await activities.chargeCard();`,

        // Retry value is a non-object (variable reference) — unknown, so no report
        `const activities = proxyActivities({ retry: retryPolicy });
         await activities.chargeCard();`,

        // Retry object without maximumAttempts property — defaults apply, should report
        // (valid here because the activity name doesn't match any pattern)
        `const activities = proxyActivities({ retry: {} });
         await activities.checkBalance();`,

        // String maximumAttempts that is not a valid number — unknown, so no report
        `const activities = proxyActivities({ retry: { maximumAttempts: 'unlimited' } });
         await activities.chargeCard();`,

        // Computed property access with non-matching name — no report
        `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
         await activities['checkBalance']();`,

        // Non-proxy call expression in VariableDeclarator — isProxyActivitiesCall returns false
        `const activities = createActivities({ retry: { maximumAttempts: 3 } });
         await activities.chargeCard();`,

        // proxyLocalActivities via member expression — valid with maxAttempts: 1
        `import * as wf from '@temporalio/workflow';
         const activities = wf.proxyLocalActivities<Activities>({ retry: { maximumAttempts: 1 } });
         await activities.chargeCard();`,
      ],
      invalid: [
        {
          code: `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
                 await activities.chargeCustomer();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await activities.chargeCustomer();`,
                },
              ],
            },
          ],
        },
        {
          code: `const activities = proxyActivities({ startToCloseTimeout: '1m' });
                 // @nonIdempotent
                 await activities.refundPayment();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `const activities = proxyActivities({ startToCloseTimeout: '1m' });
                 // @nonIdempotent
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await activities.refundPayment();`,
                },
              ],
            },
          ],
        },
        {
          code: `import * as wf from '@temporalio/workflow';
                 const activities = wf.proxyActivities<Activities>({ retry: { maximumAttempts: 3 } });
                 await activities.sendReceipt();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `import * as wf from '@temporalio/workflow';
                 const activities = wf.proxyActivities<Activities>({ retry: { maximumAttempts: 3 } });
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await activities.sendReceipt();`,
                },
              ],
            },
          ],
        },
        {
          code: `const { createInvoice } = proxyActivities({ retry: { maximumAttempts: 2 } });
                 await createInvoice();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `const { createInvoice } = proxyActivities({ retry: { maximumAttempts: 2 } });
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await createInvoice();`,
                },
              ],
            },
          ],
        },
        // Computed property access: activities['chargeCard']() — covers getActivityName literal branch
        {
          code: `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
                 await activities['chargeCard']();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await activities['chargeCard']();`,
                },
              ],
            },
          ],
        },
        // Retry object with no maximumAttempts property — defaults to hasMaxAttemptsOne: false
        {
          code: `const activities = proxyActivities({ retry: {} });
                 await activities.chargeCard();`,
          errors: [
            {
              messageId: 'noRetryForNonIdempotent',
              suggestions: [
                {
                  messageId: 'disableForLine',
                  output: `const activities = proxyActivities({ retry: {} });
                 // eslint-disable-next-line temporal/workflow-no-retry-for-nonidempotent-activities -- verified safe
                 await activities.chargeCard();`,
                },
              ],
            },
          ],
        },
      ],
    },
  );
});
