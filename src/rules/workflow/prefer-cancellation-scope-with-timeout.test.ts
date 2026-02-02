import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferCancellationScopeWithTimeout } from './prefer-cancellation-scope-with-timeout.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-cancellation-scope-with-timeout', () => {
  ruleTester.run(
    'prefer-cancellation-scope-with-timeout',
    preferCancellationScopeWithTimeout,
    {
      valid: [
        `await CancellationScope.withTimeout('1m', async () => {
           await activities.doWork();
         });`,
        `await Promise.race([doWork(), doOtherWork()]);`,
      ],
      invalid: [
        {
          code: `await Promise.race([sleep('1m'), activities.doWork()]);`,
          errors: [{ messageId: 'preferCancellationScopeWithTimeout' }],
        },
        {
          code: `await Promise.race([
                   condition(() => ready, '10s'),
                   activities.doWork()
                 ]);`,
          errors: [{ messageId: 'preferCancellationScopeWithTimeout' }],
        },
      ],
    },
  );
});
