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
      ],
    },
  );
});
