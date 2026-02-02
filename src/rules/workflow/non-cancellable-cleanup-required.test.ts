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
    ],
  });
});
