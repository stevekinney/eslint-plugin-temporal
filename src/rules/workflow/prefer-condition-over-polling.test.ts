import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferConditionOverPolling } from './prefer-condition-over-polling.ts';

const ruleTester = createBasicRuleTester();

describe('prefer-condition-over-polling', () => {
  ruleTester.run('prefer-condition-over-polling', preferConditionOverPolling, {
    valid: [
      // Using condition() properly
      `await condition(() => state.ready);`,

      // Using condition() with timeout
      `await condition(() => state.ready, '30s');`,

      // While loop without sleep (not a polling pattern)
      `
        let i = 0;
        while (i < 10) {
          process(items[i]);
          i++;
        }
      `,

      // Sleep outside of a loop
      `
        await sleep(1000);
        doSomething();
      `,

      // Non-await sleep in loop (not async polling)
      `
        while (condition) {
          sleep(100);
        }
      `,

      // For loop with sleep (less common polling pattern, not flagged)
      `
        for (let i = 0; i < 10; i++) {
          await sleep(100);
        }
      `,
    ],
    invalid: [
      // Basic polling pattern
      {
        code: `
          while (true) {
            if (state.ready) break;
            await sleep(1000);
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // Polling with negated condition
      {
        code: `
          while (!state.ready) {
            await sleep(1000);
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // Polling with compound condition
      {
        code: `
          while (state.count < 10 && !state.done) {
            await sleep(500);
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // do-while polling
      {
        code: `
          do {
            await sleep(1000);
          } while (!state.ready);
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // Polling with additional logic
      {
        code: `
          while (!isComplete) {
            checkStatus();
            await sleep(2000);
            logProgress();
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // Polling with variable sleep
      {
        code: `
          while (condition) {
            await sleep(interval);
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },

      // Nested conditional with sleep
      {
        code: `
          while (running) {
            if (needsDelay) {
              await sleep(1000);
            }
          }
        `,
        errors: [{ messageId: 'preferCondition' }],
      },
    ],
  });
});
