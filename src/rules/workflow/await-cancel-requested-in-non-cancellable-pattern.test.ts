import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { awaitCancelRequestedInNonCancellablePattern } from './await-cancel-requested-in-non-cancellable-pattern.ts';

const ruleTester = createWorkflowRuleTester();

describe('await-cancel-requested-in-non-cancellable-pattern', () => {
  ruleTester.run(
    'await-cancel-requested-in-non-cancellable-pattern',
    awaitCancelRequestedInNonCancellablePattern,
    {
      valid: [
        `try {
           await doWork();
         } catch (err) {
           if (err instanceof CancelledFailure) {
             await CancellationScope.nonCancellable(async () => {
               await cleanup();
             });
             await CancellationScope.current().cancelRequested;
             throw err;
           }
         }`,
      ],
      invalid: [
        {
          code: `try {
                   await doWork();
                 } catch (err) {
                   if (err instanceof CancelledFailure) {
                     await CancellationScope.nonCancellable(async () => {
                       await cleanup();
                     });
                     throw err;
                   }
                 }`,
          errors: [{ messageId: 'awaitCancelRequested' }],
        },
      ],
    },
  );
});
