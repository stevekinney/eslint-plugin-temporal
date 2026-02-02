import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noQueryMutation } from './no-query-mutation.ts';

const ruleTester = createBasicRuleTester();

describe('no-query-mutation', () => {
  ruleTester.run('no-query-mutation', noQueryMutation, {
    valid: [
      // Pure read query handler
      `const getStatus = defineQuery('status');
       setHandler(getStatus, () => {
         return { status: workflowStatus, count: itemCount };
       });`,

      // Query handler with local variable
      `const getItems = defineQuery('items');
       setHandler(getItems, () => {
         const filtered = items.filter(i => i.active);
         return filtered;
       });`,

      // Signal handler can mutate
      `const mySignal = defineSignal('update');
       setHandler(mySignal, () => {
         workflowState = 'updated';
       });`,

      // Update handler can mutate
      `const myUpdate = defineUpdate('modify');
       setHandler(myUpdate, (value) => {
         state = value;
         return state;
       });`,

      // Query with local variable reassignment (ok)
      `const query = defineQuery('q');
       setHandler(query, () => {
         let result = 0;
         result = compute();
         return result;
       });`,

      // Parameter reassignment is fine
      `const query = defineQuery('q');
       setHandler(query, (input) => {
         input = input.trim();
         return items[input];
       });`,
    ],
    invalid: [
      // Direct state mutation
      {
        code: `const query = defineQuery('count');
               setHandler(query, () => {
                 queryCount = queryCount + 1;
                 return count;
               });`,
        errors: [{ messageId: 'noQueryMutation' }],
      },

      // Object property mutation
      {
        code: `const query = defineQuery('status');
               setHandler(query, () => {
                 state.lastQueried = Date.now();
                 return state;
               });`,
        errors: [{ messageId: 'noQueryMutation' }],
      },

      // Array mutation
      {
        code: `const query = defineQuery('items');
               setHandler(query, () => {
                 items[0] = 'modified';
                 return items;
               });`,
        errors: [{ messageId: 'noQueryMutation' }],
      },

      // Increment operator
      {
        code: `const query = defineQuery('counter');
               setHandler(query, () => {
                 counter++;
                 return counter;
               });`,
        errors: [{ messageId: 'noQueryMutation' }],
      },

      // Inline defineQuery with mutation
      {
        code: `setHandler(defineQuery('bad'), () => {
                 globalState = 'changed';
                 return globalState;
               });`,
        errors: [{ messageId: 'noQueryMutation' }],
      },
    ],
  });
});
