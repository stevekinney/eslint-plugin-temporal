import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireSetHandlerEarly } from './require-setHandler-early.ts';

const ruleTester = createBasicRuleTester();

describe('require-setHandler-early', () => {
  ruleTester.run('require-setHandler-early', requireSetHandlerEarly, {
    valid: [
      // setHandler before any awaits
      `
        async function myWorkflow() {
          const mySignal = defineSignal('mySignal');
          setHandler(mySignal, () => {});

          await sleep(1000);
        }
      `,

      // Multiple setHandlers before await
      `
        async function myWorkflow() {
          const mySignal = defineSignal('mySignal');
          const myQuery = defineQuery('myQuery');
          const myUpdate = defineUpdate('myUpdate');

          setHandler(mySignal, () => {});
          setHandler(myQuery, () => state);
          setHandler(myUpdate, (value) => { state = value; return state; });

          await sleep(1000);
          await activities.doSomething();
        }
      `,

      // No await at all
      `
        function syncWorkflow() {
          const mySignal = defineSignal('mySignal');
          setHandler(mySignal, () => {});
        }
      `,

      // Arrow function workflow
      `
        const myWorkflow = async () => {
          const mySignal = defineSignal('mySignal');
          setHandler(mySignal, () => {});

          await sleep(1000);
        };
      `,

      // setHandler in nested function is fine (different scope)
      `
        async function myWorkflow() {
          await sleep(1000);

          function registerHandlers() {
            const mySignal = defineSignal('mySignal');
            setHandler(mySignal, () => {});
          }
        }
      `,

      // Callback inside handler is different scope
      `
        async function myWorkflow() {
          const mySignal = defineSignal('mySignal');
          setHandler(mySignal, async () => {
            await sleep(100);
            // This is inside the handler callback, not the workflow
          });

          await sleep(1000);
        }
      `,
    ],
    invalid: [
      // setHandler after await
      {
        code: `
          async function myWorkflow() {
            await sleep(1000);

            const mySignal = defineSignal('mySignal');
            setHandler(mySignal, () => {});
          }
        `,
        errors: [{ messageId: 'setHandlerAfterAwait' }],
      },

      // Multiple setHandlers after await
      {
        code: `
          async function myWorkflow() {
            await sleep(1000);

            const mySignal = defineSignal('mySignal');
            const myQuery = defineQuery('myQuery');
            setHandler(mySignal, () => {});
            setHandler(myQuery, () => state);
          }
        `,
        errors: [
          { messageId: 'setHandlerAfterAwait' },
          { messageId: 'setHandlerAfterAwait' },
        ],
      },

      // Some before, some after await
      {
        code: `
          async function myWorkflow() {
            const mySignal = defineSignal('mySignal');
            setHandler(mySignal, () => {});

            await sleep(1000);

            const myQuery = defineQuery('myQuery');
            setHandler(myQuery, () => state);
          }
        `,
        errors: [{ messageId: 'setHandlerAfterAwait' }],
      },

      // Arrow function expression workflow
      {
        code: `
          const myWorkflow = async () => {
            await activities.init();

            const mySignal = defineSignal('mySignal');
            setHandler(mySignal, () => {});
          };
        `,
        errors: [{ messageId: 'setHandlerAfterAwait' }],
      },

      // Function expression
      {
        code: `
          const myWorkflow = async function() {
            await activities.init();

            const mySignal = defineSignal('mySignal');
            setHandler(mySignal, () => {});
          };
        `,
        errors: [{ messageId: 'setHandlerAfterAwait' }],
      },

      // setHandler deep in conditional after await
      {
        code: `
          async function myWorkflow() {
            await sleep(1000);

            if (condition) {
              const mySignal = defineSignal('mySignal');
              setHandler(mySignal, () => {});
            }
          }
        `,
        errors: [{ messageId: 'setHandlerAfterAwait' }],
      },
    ],
  });
});
