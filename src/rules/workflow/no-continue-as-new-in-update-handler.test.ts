import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noContinueAsNewInUpdateHandler } from './no-continue-as-new-in-update-handler.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-continue-as-new-in-update-handler', () => {
  ruleTester.run('no-continue-as-new-in-update-handler', noContinueAsNewInUpdateHandler, {
    valid: [
      // Update handler that doesn't use continueAsNew
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, async (value) => {
          state.value = value;
          return state.value;
        });
      `,

      // Signal handler can use continueAsNew (recommended pattern)
      `
        const triggerContinueAsNew = defineSignal('triggerContinueAsNew');
        setHandler(triggerContinueAsNew, async () => {
          await continueAsNew();
        });
      `,

      // Query handler (would be caught by different rule, but not this one)
      `
        const getState = defineQuery('getState');
        setHandler(getState, () => state);
      `,

      // continueAsNew in main workflow code is fine
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, async (value) => {
          state.shouldContinue = true;
          return value;
        });

        if (state.shouldContinue) {
          await continueAsNew(state);
        }
      `,

      // continueAsNew in a different function outside handler
      `
        async function handleContinue() {
          await continueAsNew(state);
        }

        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, (value) => {
          state.value = value;
          return value;
        });
      `,
    ],
    invalid: [
      // continueAsNew in update handler with arrow function
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async (value) => {
            state.value = value;
            await continueAsNew(state);
          });
        `,
        errors: [{ messageId: 'noContinueAsNewInUpdateHandler' }],
      },

      // continueAsNew in update handler with function expression
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async function(value) {
            state.value = value;
            await continueAsNew(state);
          });
        `,
        errors: [{ messageId: 'noContinueAsNewInUpdateHandler' }],
      },

      // continueAsNew in conditional within update handler
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async (value) => {
            if (state.count > 1000) {
              await continueAsNew(state);
            }
            state.value = value;
            return value;
          });
        `,
        errors: [{ messageId: 'noContinueAsNewInUpdateHandler' }],
      },

      // continueAsNew without await in update handler
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async (value) => {
            continueAsNew(state);
            return value;
          });
        `,
        errors: [{ messageId: 'noContinueAsNewInUpdateHandler' }],
      },

      // Multiple continueAsNew calls
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async (value) => {
            if (value > 100) {
              await continueAsNew({ count: 0 });
            }
            if (value < -100) {
              await continueAsNew({ count: 0 });
            }
            return value;
          });
        `,
        errors: [
          { messageId: 'noContinueAsNewInUpdateHandler' },
          { messageId: 'noContinueAsNewInUpdateHandler' },
        ],
      },
    ],
  });
});
