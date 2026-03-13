import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noSwallowCancellation } from './no-swallow-cancellation.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-swallow-cancellation', () => {
  ruleTester.run('no-swallow-cancellation', noSwallowCancellation, {
    valid: [
      `try {
         await doWork();
       } catch (err) {
         if (err instanceof CancelledFailure) {
           throw err;
         }
       }`,
      `try {
         await doWork();
       } catch (err) {
         if (isCancellationError(err)) {
           throw err;
         }
         throw err;
       }`,
      `try {
         await doWork();
       } catch (err) {
         logError(err);
       }`,
      `try {
         await doWork();
       } catch (e) {
         if (isCancellationError(e)) {
           throw e;
         }
       }`,
      `try {
         await doWork();
       } catch (e) {
         if (e instanceof CancelledFailure) {
           throw e;
         }
       }`,
      `try {
         await doWork();
       } catch (err) {
         if (err.name === 'CancelledFailure') {
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
                   return;
                 }
               }`,
        errors: [{ messageId: 'noSwallowCancellation' }],
      },
      {
        code: `try {
                 await doWork();
               } catch (err) {
                 if (isCancellationError(err)) {
                   log.info('cancelled');
                 }
               }`,
        errors: [{ messageId: 'noSwallowCancellation' }],
      },
      {
        code: `try {
                 await doWork();
               } catch (e) {
                 if (isCancellationError(e)) {
                   return;
                 }
               }`,
        errors: [{ messageId: 'noSwallowCancellation' }],
      },
      {
        code: `try {
                 await doWork();
               } catch (e) {
                 if (e instanceof CancelledFailure) {
                   log.info('cancelled');
                 }
               }`,
        errors: [{ messageId: 'noSwallowCancellation' }],
      },
    ],
  });
});
