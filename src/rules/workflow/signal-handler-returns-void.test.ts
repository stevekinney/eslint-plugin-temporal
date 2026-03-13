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

      // setHandler called with no arguments (getHandlerType returns 'unknown', line 39)
      `setHandler();`,

      // setHandler with non-defineSignal inline call (getHandlerType inline call not matching, lines 54-56)
      `setHandler(someOtherFunction('sig'), (val) => { return val; });`,

      // setHandler with only definition arg but no callback (getHandlerCallback returns undefined, line 75)
      `const sig = defineSignal('sig');
       setHandler(sig);`,

      // setHandler with identifier callback reference (getHandlerCallback returns Identifier, line 84)
      `const sig = defineSignal('sig');
       setHandler(sig, myHandlerFunction);`,

      // Arrow function returning undefined explicitly (hasReturnValue returns false for undefined body, line 115)
      `const sig = defineSignal('sig');
       setHandler(sig, () => undefined);`,

      // Signal handler with return void expression (containsReturnWithValue returns false for void, lines 148-149)
      `const sig = defineSignal('sig');
       setHandler(sig, () => {
         return void doSomething();
       });`,

      // Signal handler with nested function that returns a value (don't traverse, lines 161-162)
      `const sig = defineSignal('sig');
       setHandler(sig, () => {
         const helper = function() { return 42; };
         helper();
       });`,

      // Non-matching inline callee (MemberExpression callee for inline definition, line 54-56)
      `setHandler(wf.defineSignal('sig'), (val) => { return val; });`,
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

      // Return value inside if-else (object-type child traversal, line 186 of handler-analysis)
      {
        code: `const sig = defineSignal('sig');
               setHandler(sig, (data) => {
                 if (data) return data;
               });`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },

      // Return value inside try block
      {
        code: `const sig = defineSignal('sig');
               setHandler(sig, (data) => {
                 try {
                   return data;
                 } catch (e) {}
               });`,
        errors: [{ messageId: 'signalMustReturnVoid' }],
      },
    ],
  });
});
