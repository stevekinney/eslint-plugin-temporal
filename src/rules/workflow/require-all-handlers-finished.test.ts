import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireAllHandlersFinished } from './require-all-handlers-finished.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-all-handlers-finished', () => {
  ruleTester.run('require-all-handlers-finished', requireAllHandlersFinished, {
    valid: [
      // No async handlers
      `export async function myWorkflow() {
         const mySignal = defineSignal('signal');
         setHandler(mySignal, (data) => {
           state = data;
         });
         return state;
       }`,

      // Async handler with allHandlersFinished check
      `export async function myWorkflow() {
         const mySignal = defineSignal('signal');
         setHandler(mySignal, async (data) => {
           await processData(data);
         });

         await condition(allHandlersFinished);
         return state;
       }`,

      // Async handler with arrow function allHandlersFinished check
      `export async function myWorkflow() {
         const myUpdate = defineUpdate('update');
         setHandler(myUpdate, async (data) => {
           await saveData(data);
           return { success: true };
         });

         await condition(() => allHandlersFinished());
         return finalState;
       }`,

      // No workflow function (not a workflow file)
      `const mySignal = defineSignal('signal');
       setHandler(mySignal, async () => {
         await doSomething();
       });`,
    ],
    invalid: [
      // Async handler without allHandlersFinished check
      {
        code: `export async function myWorkflow() {
                 const mySignal = defineSignal('signal');
                 setHandler(mySignal, async (data) => {
                   await processData(data);
                 });

                 return state;
               }`,
        errors: [{ messageId: 'requireAllHandlersFinished' }],
      },

      // Multiple async handlers without check
      {
        code: `export async function orderWorkflow() {
                 const updateSignal = defineSignal('update');
                 const cancelSignal = defineSignal('cancel');

                 setHandler(updateSignal, async (data) => {
                   await updateOrder(data);
                 });

                 setHandler(cancelSignal, async () => {
                   await cancelOrder();
                 });

                 await condition(() => isComplete);
                 return result;
               }`,
        errors: [{ messageId: 'requireAllHandlersFinished' }],
      },

      // Arrow function workflow without check
      {
        code: `export const myWorkflow = async () => {
                 const sig = defineSignal('sig');
                 setHandler(sig, async () => {
                   await work();
                 });
                 return done;
               };`,
        errors: [{ messageId: 'requireAllHandlersFinished' }],
      },
    ],
  });
});
