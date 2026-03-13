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
        // cancelRequested as a property access
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
        // cancelRequested as a method call
        `try {
           await doWork();
         } catch (err) {
           if (err instanceof CancelledFailure) {
             await CancellationScope.nonCancellable(async () => {
               await cleanup();
             });
             await scope.cancelRequested();
             throw err;
           }
         }`,
        // Cancellation check via isCancellationError function call
        `try {
           await doWork();
         } catch (err) {
           if (isCancellationError(err)) {
             await CancellationScope.nonCancellable(async () => {
               await cleanup();
             });
             await CancellationScope.current().cancelRequested;
             throw err;
           }
         }`,
        // No cancellation check in catch clause — rule should not fire
        `try {
           await doWork();
         } catch (err) {
           await CancellationScope.nonCancellable(async () => {
             await cleanup();
           });
         }`,
        // Catch clause with no nonCancellable call — rule should not fire
        `try {
           await doWork();
         } catch (err) {
           if (err instanceof CancelledFailure) {
             await cleanup();
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
        {
          code: `try {
                   await doWork();
                 } catch (err) {
                   if (err.name === 'CancelledFailure') {
                     await CancellationScope.nonCancellable(async () => {
                       await cleanup();
                     });
                     throw err;
                   }
                 }`,
          errors: [{ messageId: 'awaitCancelRequested' }],
        },
        // Cancellation check via isCancellationError function call without cancelRequested
        {
          code: `try {
                   await doWork();
                 } catch (err) {
                   if (isCancellationError(err)) {
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
