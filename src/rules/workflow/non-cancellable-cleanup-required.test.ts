import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { nonCancellableCleanupRequired } from './non-cancellable-cleanup-required.ts';

const ruleTester = createWorkflowRuleTester();

describe('non-cancellable-cleanup-required', () => {
  ruleTester.run('non-cancellable-cleanup-required', nonCancellableCleanupRequired, {
    valid: [
      `try {
         await doWork();
       } catch (err) {
         if (err instanceof CancelledFailure) {
           await CancellationScope.nonCancellable(async () => {
             await cleanup();
           });
           throw err;
         }
       }`,
      `try {
         await doWork();
       } catch (err) {
         if (isCancellationError(err)) {
           log.info('cancelled');
           throw err;
         }
       }`,
      // No cancellation check in catch body — not relevant
      `try {
         await doWork();
       } catch (err) {
         await cleanup();
       }`,
      // Cancellation check via err.name === string but no await — valid
      `try {
         await doWork();
       } catch (err) {
         if (err.name === 'CancelledFailure') {
           log.info('cancelled');
         }
       }`,
      // Cancellation check via err.name !== string — no await — valid
      `try {
         await doWork();
       } catch (err) {
         if (err.name !== 'CancelledFailure') {
           log.info('not cancelled');
         }
       }`,
      // Cancellation check via err.name == string (loose equality) — no await — valid
      `try {
         await doWork();
       } catch (err) {
         if (err.name == 'CancelledFailure') {
           log.info('cancelled');
         }
       }`,
      // Await inside a nested function in the catch body should not count (containsAwait returns false for function boundaries)
      `try {
         await doWork();
       } catch (err) {
         if (err instanceof CancelledFailure) {
           const fn = async function() { await cleanup(); };
         }
       }`,
      // Await inside a nested arrow function in the catch body should not count
      `try {
         await doWork();
       } catch (err) {
         if (err instanceof CancelledFailure) {
           const fn = async () => { await cleanup(); };
         }
       }`,
    ],
    invalid: [
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (err instanceof CancelledFailure) {
                   await cleanup();
                   throw err;
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (isCancellationError(err)) {
                   await cleanup();
                   throw err;
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
      // String comparison: err.name === 'CancelledFailure' with await
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (err.name === 'CancelledFailure') {
                   await cleanup();
                   throw err;
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
      // String comparison: err.name == 'CancellationError' with await (loose equality)
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (err.name == 'CancellationError') {
                   await cleanup();
                   throw err;
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
      // String comparison: err.name !== 'CancelledFailure' with await
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (err.name !== 'CancelledFailure') {
                   doOther();
                 } else {
                   await cleanup();
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
      // isCancelledError function check with await
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (isCancelledError(err)) {
                   await cleanup();
                   throw err;
                 }
               }`,
        errors: [{ messageId: 'nonCancellableCleanupRequired' }],
      },
    ],
  });
});
