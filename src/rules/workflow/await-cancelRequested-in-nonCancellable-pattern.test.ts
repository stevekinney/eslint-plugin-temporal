import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { awaitCancelRequestedInNonCancellablePattern } from './await-cancelRequested-in-nonCancellable-pattern.ts';

const ruleTester = createWorkflowRuleTester();

describe('await-cancelRequested-in-nonCancellable-pattern', () => {
  ruleTester.run(
    'await-cancelRequested-in-nonCancellable-pattern',
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
