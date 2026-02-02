import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noBusyWait } from './no-busy-wait.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-busy-wait', () => {
  ruleTester.run('no-busy-wait', noBusyWait, {
    valid: [
      // Loop with await sleep
      `import { sleep } from '@temporalio/workflow';
       while (shouldContinue) {
         await sleep('1s');
         checkStatus();
       }`,

      // Loop with await condition
      `import { condition } from '@temporalio/workflow';
       while (true) {
         await condition(() => isReady);
         process();
       }`,

      // Loop with await activity call
      `while (items.length > 0) {
         const item = items.pop();
         await processItem(item);
       }`,

      // Synchronous data processing loop (legitimate use)
      `const results = [];
       for (const item of items) {
         results.push(transform(item));
       }`,

      // For loop with await
      `for (let i = 0; i < 10; i++) {
         await doStep(i);
       }`,

      // Do-while with await
      `do {
         await checkStatus();
       } while (!isComplete);`,

      // Finite loop with break and processing
      `while (items.length > 0) {
         const item = items.pop();
         process(item);
       }`,

      // Conditional loop without infinite condition
      `while (shouldContinue) {
         doWork();
       }`,
    ],
    invalid: [
      // Infinite while(true) without await
      {
        code: `while (true) {
          doSomething();
        }`,
        errors: [{ messageId: 'noBusyWait' }],
      },

      // Empty while body
      {
        code: `while (!isReady) {}`,
        errors: [{ messageId: 'noBusyWait' }],
      },

      // Empty for loop (infinite)
      {
        code: `for (;;) {
          checkSomething();
        }`,
        errors: [{ messageId: 'noBusyWait' }],
      },

      // Empty do-while
      {
        code: `do {} while (waiting);`,
        errors: [{ messageId: 'noBusyWait' }],
      },
    ],
  });
});
