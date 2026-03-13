import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noAwaitInHandlerWithoutExitGuard } from './no-await-in-handler-without-exit-guard.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-await-in-handler-without-exit-guard', () => {
  ruleTester.run(
    'no-await-in-handler-without-exit-guard',
    noAwaitInHandlerWithoutExitGuard,
    {
      valid: [
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await sleep('1s');
           });

           await condition(allHandlersFinished);
         }`,
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, () => {
             doWork();
           });
         }`,
        `export async function myWorkflow() {
           const update = defineUpdate('update');
           setHandler(update, async () => {
             await doWork();
           });
           await condition(() => allHandlersFinished);
         }`,

        // allHandlersFinished() wrapped in an arrow as a function call guard
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await sleep('1s');
           });

           await condition(() => allHandlersFinished());
         }`,

        // Query handler type should be skipped (no exit guard needed)
        `export async function myWorkflow() {
           const query = defineQuery('query');
           setHandler(query, async () => {
             await fetchData();
           });
         }`,

        // Handler callback passed as an identifier reference (line 210)
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, myAsyncHandler);
         }`,

        // Handler with nested function that has await — should not count as handler-level await (lines 134-135)
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, () => {
             const nested = async () => {
               await doWork();
             };
             nested();
           });
         }`,

        // Variable declarator with member expression callee (line 178)
        `export async function myWorkflow() {
           const result = workflow.execute();
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await doWork();
           });
           await condition(allHandlersFinished);
         }`,

        // Variable declarator with non-call init (line 178 - early return for non-CallExpression init)
        `export async function myWorkflow() {
           const value = 42;
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await doWork();
           });
           await condition(allHandlersFinished);
         }`,

        // Handler with unknown type (not signal/update/query) should be skipped
        `export async function myWorkflow() {
           const unknown = defineValidator('validator');
           setHandler(unknown, async () => {
             await doWork();
           });
         }`,

        // allHandlersFinished nested inside a wrapper function call argument (line 40 - array child path)
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await sleep('1s');
           });

           await condition(wrappedCheck(allHandlersFinished));
         }`,

        // Arrow function referencing allHandlersFinished in workflow body without condition()
        // This tests containsAllHandlersFinishedCheck finding allHandlersFinished in an arrow body
        // (lines 74, 88, 94, 240-241)
        `export async function myWorkflow() {
           const sig = defineSignal('sig');
           setHandler(sig, async () => {
             await sleep('1s');
           });
           const check = () => allHandlersFinished;
         }`,
      ],
      invalid: [
        {
          code: `export async function myWorkflow() {
                   const sig = defineSignal('sig');
                   setHandler(sig, async () => {
                     await sleep('1s');
                   });
                 }`,
          errors: [{ messageId: 'missingExitGuard' }],
        },
        {
          code: `export async function myWorkflow() {
                   const update = defineUpdate('update');
                   setHandler(update, async () => {
                     await doWork();
                   });
                 }`,
          errors: [{ messageId: 'missingExitGuard' }],
        },

        // Arrow function handler with await but no exit guard
        {
          code: `export const myWorkflow = async () => {
                   const sig = defineSignal('sig');
                   setHandler(sig, async () => {
                     await processSignal();
                   });
                 };`,
          errors: [{ messageId: 'missingExitGuard' }],
        },

        // Handler with await whose callback also has a nested function with await (lines 134-135)
        // The handler itself has a top-level await, so it should be flagged
        {
          code: `export async function myWorkflow() {
                   const sig = defineSignal('sig');
                   setHandler(sig, async () => {
                     await topLevelWork();
                     const nested = async () => {
                       await nestedWork();
                     };
                   });
                 }`,
          errors: [{ messageId: 'missingExitGuard' }],
        },

        // Variable declarator with member expression callee - no guard (line 178)
        {
          code: `export async function myWorkflow() {
                   const result = workflow.execute();
                   const sig = defineSignal('sig');
                   setHandler(sig, async () => {
                     await doWork();
                   });
                 }`,
          errors: [{ messageId: 'missingExitGuard' }],
        },
      ],
    },
  );
});
