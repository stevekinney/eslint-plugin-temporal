import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noLargeLiteralActivityPayloads } from './no-large-literal-activity-payloads.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-large-literal-activity-payloads', () => {
  ruleTester.run('no-large-literal-activity-payloads', noLargeLiteralActivityPayloads, {
    valid: [
      // Small array
      `
        const activities = proxyActivities();
        await activities.process([1, 2, 3, 4, 5]);
      `,

      // Small object
      `
        const activities = proxyActivities();
        await activities.process({ a: 1, b: 2, c: 3 });
      `,

      // Variable reference (can't statically check)
      `
        const activities = proxyActivities();
        await activities.process(largeData);
      `,

      // Small string
      `
        const activities = proxyActivities();
        await activities.process('hello world');
      `,

      // Non-activity calls
      `someOtherFunction([1, 2, 3, 4, 5]);`,

      // With custom limits - array under limit
      {
        code: `
          const activities = proxyActivities();
          await activities.process([1, 2, 3, 4, 5]);
        `,
        options: [{ maxArrayElements: 10 }],
      },
    ],
    invalid: [
      // Large array (using small limit for testing)
      {
        code: `
          const activities = proxyActivities();
          await activities.process([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        `,
        options: [{ maxArrayElements: 10 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
            data: { count: '11' },
          },
        ],
      },

      // Large object (using small limit for testing)
      {
        code: `
          const activities = proxyActivities();
          await activities.process({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
        `,
        options: [{ maxObjectProperties: 5 }],
        errors: [
          {
            messageId: 'largeObjectPayload',
            data: { count: '6' },
          },
        ],
      },

      // Large string (using small limit for testing)
      {
        code: `
          const activities = proxyActivities();
          await activities.process('this is a very long string for testing');
        `,
        options: [{ maxStringLength: 20 }],
        errors: [
          {
            messageId: 'largeStringPayload',
          },
        ],
      },

      // Large array with proxyLocalActivities
      {
        code: `
          const localActs = proxyLocalActivities();
          await localActs.process([1, 2, 3, 4, 5, 6]);
        `,
        options: [{ maxArrayElements: 5 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
            data: { count: '6' },
          },
        ],
      },

      // Multiple large payloads
      {
        code: `
          const activities = proxyActivities();
          await activities.process([1, 2, 3, 4, 5, 6], { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
        `,
        options: [{ maxArrayElements: 5, maxObjectProperties: 5 }],
        errors: [{ messageId: 'largeArrayPayload' }, { messageId: 'largeObjectPayload' }],
      },

      // Nested object counting
      {
        code: `
          const activities = proxyActivities();
          await activities.process({
            a: { nested1: 1, nested2: 2 },
            b: { nested3: 3, nested4: 4 },
            c: 5
          });
        `,
        options: [{ maxObjectProperties: 5 }],
        errors: [
          {
            messageId: 'largeObjectPayload',
            data: { count: '7' },
          },
        ],
      },

      // Destructured proxy activities without rename
      {
        code: `
          const { send } = proxyActivities();
          await send([1, 2, 3, 4, 5, 6]);
        `,
        options: [{ maxArrayElements: 5 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
            data: { count: '6' },
          },
        ],
      },

      // Large payload as second argument
      {
        code: `
          const activities = proxyActivities();
          await activities.func(smallId, [1, 2, 3, 4, 5, 6]);
        `,
        options: [{ maxArrayElements: 5 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
            data: { count: '6' },
          },
        ],
      },

      // Template literal payload
      {
        code: `
          const activities = proxyActivities();
          await activities.process(\`this is a very long string for testing\`);
        `,
        options: [{ maxStringLength: 20 }],
        errors: [
          {
            messageId: 'largeStringPayload',
          },
        ],
      },

      // Nested arrays counting
      {
        code: `
          const activities = proxyActivities();
          await activities.process([[1, 2, 3], [4, 5, 6]]);
        `,
        options: [{ maxArrayElements: 5 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
            data: { count: '8' },
          },
        ],
      },
    ],
  });
});
