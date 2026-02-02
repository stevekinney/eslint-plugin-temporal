import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { signalHandlerReturnsVoid } from './signal-handler-returns-void.ts';

const ruleTester = createWorkflowRuleTester();

describe('signal-handler-returns-void', () => {
  ruleTester.run('signal-handler-returns-void', signalHandlerReturnsVoid, {
    valid: [
      // Signal handler with no return
      `const mySignal = defineSignal('my-signal');
       setHandler(mySignal, (data) => {
         workflowState = data;
       });`,

      // Signal handler with empty return
      `const mySignal = defineSignal('my-signal');
       setHandler(mySignal, (data) => {
         if (!data) return;
         workflowState = data;
       });`,

      // Signal handler returning undefined explicitly
      `const mySignal = defineSignal('my-signal');
       setHandler(mySignal, () => {
         doSomething();
         return undefined;
       });`,

      // Query handler can return values
      `const myQuery = defineQuery('my-query');
       setHandler(myQuery, () => {
         return workflowState;
       });`,

      // Update handler can return values
      `const myUpdate = defineUpdate('my-update');
       setHandler(myUpdate, () => {
         return { success: true };
       });`,

      // Arrow function with void expression
      `const mySignal = defineSignal('signal');
       setHandler(mySignal, () => void doSomething());`,

      // Inline defineSignal with no return
      `setHandler(defineSignal('sig'), (val) => { state = val; });`,
    ],
    invalid: [
      // Signal handler returning a value
      {
        code: `const mySignal = defineSignal('my-signal');
               setHandler(mySignal, (data) => {
                 workflowState = data;
                 return { updated: true };
               });`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },

      // Arrow function with implicit return
      {
        code: `const mySignal = defineSignal('my-signal');
               setHandler(mySignal, (data) => processAndReturn(data));`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },

      // Arrow function returning object literal
      {
        code: `const sig = defineSignal('sig');
               setHandler(sig, () => ({ status: 'ok' }));`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },

      // Inline defineSignal with return
      {
        code: `setHandler(defineSignal('sig'), () => {
                 state = 'updated';
                 return state;
               });`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },
    ],
  });
});
