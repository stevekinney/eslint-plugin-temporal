import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWorkflowApisInQuery } from './no-workflow-apis-in-query.ts';

const ruleTester = createBasicRuleTester();

describe('no-workflow-apis-in-query', () => {
  ruleTester.run('no-workflow-apis-in-query', noWorkflowApisInQuery, {
    valid: [
      // Query handler that just returns state (pure read)
      `
        const getState = defineQuery('getState');
        setHandler(getState, () => workflowState);
      `,

      // Query handler that returns computed value
      `
        const getCount = defineQuery('getCount');
        setHandler(getCount, () => items.length);
      `,

      // Signal handler can use workflow APIs
      `
        const mySignal = defineSignal('mySignal');
        setHandler(mySignal, async () => {
          await sleep(1000);
        });
      `,

      // Update handler can use workflow APIs
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, async () => {
          const result = await activities.doSomething();
          return result;
        });
      `,

      // Workflow APIs outside of handlers are fine
      `
        const activities = proxyActivities();
        await sleep(1000);
        await condition(() => state.ready);
      `,

      // Query handler with local computations
      `
        const getTotal = defineQuery('getTotal');
        setHandler(getTotal, () => {
          let total = 0;
          for (const item of items) {
            total += item.price;
          }
          return total;
        });
      `,
    ],
    invalid: [
      // proxyActivities in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, () => {
            const acts = proxyActivities();
            return acts;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'proxyActivities' },
          },
        ],
      },

      // sleep in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            await sleep(1000);
            return state;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'sleep' },
          },
        ],
      },

      // condition in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            await condition(() => ready);
            return state;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'condition' },
          },
        ],
      },

      // startChild in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            const child = await startChild(childWorkflow);
            return child;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'startChild' },
          },
        ],
      },

      // executeChild in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            return await executeChild(childWorkflow);
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'executeChild' },
          },
        ],
      },

      // continueAsNew in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            await continueAsNew();
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'continueAsNew' },
          },
        ],
      },

      // Multiple violations
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async () => {
            await sleep(100);
            await condition(() => ready);
            return state;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'sleep' },
          },
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'condition' },
          },
        ],
      },

      // Using function expression
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, async function() {
            await sleep(1000);
            return state;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'sleep' },
          },
        ],
      },

      // proxyLocalActivities in query handler
      {
        code: `
          const getState = defineQuery('getState');
          setHandler(getState, () => {
            const localActs = proxyLocalActivities();
            return localActs;
          });
        `,
        errors: [
          {
            messageId: 'noWorkflowApisInQuery',
            data: { apiName: 'proxyLocalActivities' },
          },
        ],
      },
    ],
  });
});
