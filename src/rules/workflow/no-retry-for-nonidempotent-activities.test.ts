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
      ],
    },
  );
});
