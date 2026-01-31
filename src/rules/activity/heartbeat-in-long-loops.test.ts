import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { heartbeatInLongLoops } from './heartbeat-in-long-loops.ts';

const ruleTester = createBasicRuleTester();

describe('heartbeat-in-long-loops', () => {
  ruleTester.run('heartbeat-in-long-loops', heartbeatInLongLoops, {
    valid: [
      // Loop with await and heartbeat
      `for (const item of items) {
        await processItem(item);
        heartbeat();
      }`,

      // While loop with heartbeat
      `while (hasMore) {
        await fetchNext();
        Context.current().heartbeat();
      }`,

      // Loop without await (sync loop is fine)
      `for (const item of items) {
        processItemSync(item);
      }`,

      // For loop without await
      `for (let i = 0; i < 10; i++) {
        console.log(i);
      }`,

      // Await in nested function (doesn't count as loop await)
      `for (const item of items) {
        const process = async () => await doSomething(item);
        process();
      }`,
    ],
    invalid: [
      // For-of loop with await, no heartbeat
      {
        code: `for (const item of items) {
          await processItem(item);
        }`,
        errors: [{ messageId: 'missingHeartbeat' }],
      },

      // For loop with await, no heartbeat
      {
        code: `for (let i = 0; i < items.length; i++) {
          await processItem(items[i]);
        }`,
        errors: [{ messageId: 'missingHeartbeat' }],
      },

      // While loop with await, no heartbeat
      {
        code: `while (hasMore) {
          const next = await fetchNext();
          process(next);
        }`,
        errors: [{ messageId: 'missingHeartbeat' }],
      },

      // Do-while loop with await, no heartbeat
      {
        code: `do {
          await processNext();
        } while (hasMore);`,
        errors: [{ messageId: 'missingHeartbeat' }],
      },

      // For-in loop with await, no heartbeat
      {
        code: `for (const key in obj) {
          await processKey(key);
        }`,
        errors: [{ messageId: 'missingHeartbeat' }],
      },
    ],
  });
});
