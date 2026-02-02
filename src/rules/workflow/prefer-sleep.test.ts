import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferSleep } from './prefer-sleep.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-sleep', () => {
  ruleTester.run('prefer-sleep', preferSleep, {
    valid: [
      // Using Temporal's sleep
      `import { sleep } from '@temporalio/workflow';
       await sleep('5s');`,

      // Using Temporal's sleep with milliseconds
      `import { sleep } from '@temporalio/workflow';
       await sleep(5000);`,

      // Reference without call
      `const timeoutFn = setTimeout;`,

      // Different function named setTimeout
      `const myTimer = { setTimeout: (fn, ms) => {} };
       myTimer.setTimeout(callback, 1000);`,
    ],
    invalid: [
      // Basic setTimeout
      {
        code: `setTimeout(callback, 1000);`,
        errors: [{ messageId: 'preferSleep' }],
      },

      // setTimeout with arrow function
      {
        code: `setTimeout(() => { doWork(); }, 5000);`,
        errors: [{ messageId: 'preferSleep' }],
      },

      // setTimeout in promise pattern
      {
        code: `const delay = new Promise(r => setTimeout(r, 1000));`,
        errors: [{ messageId: 'preferSleep' }],
      },

      // setTimeout in promise pattern with variable delay
      {
        code: `const wait = new Promise(resolve => setTimeout(resolve, ms));`,
        errors: [{ messageId: 'preferSleep' }],
      },

      // Multiple setTimeouts
      {
        code: `setTimeout(task1, 1000);
               setTimeout(task2, 2000);`,
        errors: [{ messageId: 'preferSleep' }, { messageId: 'preferSleep' }],
      },
    ],
  });
});
