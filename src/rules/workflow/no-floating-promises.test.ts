import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noFloatingPromises } from './no-floating-promises.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-floating-promises', () => {
  ruleTester.run('no-floating-promises', noFloatingPromises, {
    valid: [
      // Awaited activity calls
      `await activities.sendEmail();`,
      `const result = await activities.processOrder(order);`,

      // Stored promises
      `const promise = activities.sendEmail();`,
      `const emailPromise = activities.sendEmail();
       const smsPromise = activities.sendSms();
       await Promise.all([emailPromise, smsPromise]);`,

      // Returned promises
      `return activities.processOrder();`,

      // Awaited Temporal functions
      `await sleep('1 minute');`,
      `await condition(() => done);`,
      `await executeChild(childWorkflow, { workflowId: 'child-1' });`,

      // Non-activity function calls (no heuristic match)
      `console.log('hello');`,
      `doSomething();`,

      // Chained promises
      `activities.sendEmail().then(() => console.log('sent'));`,
      `activities.sendEmail().catch(handleError);`,
    ],
    invalid: [
      // Floating activity calls
      {
        code: `activities.sendEmail();`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `activities.processOrder(order);`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `proxy.doWork();`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `acts.doSomething();`,
        errors: [{ messageId: 'floatingPromise' }],
      },

      // Floating Temporal function calls
      {
        code: `sleep('1 minute');`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `condition(() => done);`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `executeChild(childWorkflow, {});`,
        errors: [{ messageId: 'floatingPromise' }],
      },
      {
        code: `startChild(childWorkflow, {});`,
        errors: [{ messageId: 'floatingPromise' }],
      },

      // Floating child workflow calls
      {
        code: `childWorkflow.execute();`,
        errors: [{ messageId: 'floatingPromise' }],
      },
    ],
  });
});
