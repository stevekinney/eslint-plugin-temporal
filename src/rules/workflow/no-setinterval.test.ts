import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noSetInterval } from './no-setinterval.ts';

const ruleTester = createBasicRuleTester();

describe('no-setinterval', () => {
  ruleTester.run('no-setinterval', noSetInterval, {
    valid: [
      // Using Temporal's sleep in a loop
      `import { sleep } from '@temporalio/workflow';
       while (shouldContinue) {
         await sleep('5s');
         doWork();
       }`,

      // setTimeout is handled by another rule
      `setTimeout(callback, 1000);`,

      // Different function named setInterval
      `const myTimer = { setInterval: (fn, ms) => {} };
       myTimer.setInterval(callback, 1000);`,

      // Reference without call
      `const intervalFn = setInterval;`,
    ],
    invalid: [
      // Basic setInterval
      {
        code: `setInterval(callback, 1000);`,
        errors: [{ messageId: 'noSetInterval' }],
      },

      // With arrow function
      {
        code: `setInterval(() => { doWork(); }, 5000);`,
        errors: [{ messageId: 'noSetInterval' }],
      },

      // Stored in variable
      {
        code: `const intervalId = setInterval(checkStatus, 1000);`,
        errors: [{ messageId: 'noSetInterval' }],
      },

      // In async function
      {
        code: `export async function myWorkflow() {
          setInterval(async () => {
            await doSomething();
          }, 1000);
        }`,
        errors: [{ messageId: 'noSetInterval' }],
      },

      // Multiple setIntervals
      {
        code: `setInterval(task1, 1000);
               setInterval(task2, 2000);`,
        errors: [{ messageId: 'noSetInterval' }, { messageId: 'noSetInterval' }],
      },
    ],
  });
});
