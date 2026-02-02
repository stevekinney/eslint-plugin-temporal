import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noAsyncQueryHandler } from './no-async-query-handler.ts';

const ruleTester = createBasicRuleTester();

describe('no-async-query-handler', () => {
  ruleTester.run('no-async-query-handler', noAsyncQueryHandler, {
    valid: [
      // Sync query handler
      `const myQuery = defineQuery('my-query');
       setHandler(myQuery, () => {
         return { status: 'ok' };
       });`,

      // Sync query handler with function expression
      `const myQuery = defineQuery('my-query');
       setHandler(myQuery, function() {
         return workflowState;
       });`,

      // Signal handlers can be async
      `const mySignal = defineSignal('my-signal');
       setHandler(mySignal, async () => {
         await doSomething();
       });`,

      // Update handlers can be async
      `const myUpdate = defineUpdate('my-update');
       setHandler(myUpdate, async () => {
         await doSomething();
         return result;
       });`,

      // Inline defineQuery with sync handler
      `setHandler(defineQuery('status'), () => state);`,

      // Not a setHandler call
      `myHandler(myQuery, async () => {});`,
    ],
    invalid: [
      // Async arrow function query handler
      {
        code: `const myQuery = defineQuery('my-query');
               setHandler(myQuery, async () => {
                 return await getState();
               });`,
        errors: [{ messageId: 'noAsyncQueryHandler' }],
      },

      // Async function expression query handler
      {
        code: `const statusQuery = defineQuery('status');
               setHandler(statusQuery, async function() {
                 return await fetchState();
               });`,
        errors: [{ messageId: 'noAsyncQueryHandler' }],
      },

      // Inline defineQuery with async handler
      {
        code: `setHandler(defineQuery('my-query'), async () => result);`,
        errors: [{ messageId: 'noAsyncQueryHandler' }],
      },
    ],
  });
});
