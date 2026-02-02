import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noLargeLiteralPayloads } from './no-large-literal-payloads.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-large-literal-payloads', () => {
  ruleTester.run('no-large-literal-payloads', noLargeLiteralPayloads, {
    valid: [
      // Child workflow with small payload
      `
        await startChild(myWorkflow, { args: [{ small: 'data' }] });
      `,
      `
        await executeChild(myWorkflow, { args: [{ ok: true }] });
      `,

      // Variable reference (can't statically check)
      `
        await startChild(myWorkflow, largeData);
      `,

      // Non-child workflow calls
      `someOtherFunction([1, 2, 3, 4, 5]);`,

      // With custom limits - array under limit
      {
        code: `
          await startChild(myWorkflow, [1, 2, 3, 4, 5]);
        `,
        options: [{ maxArrayElements: 10 }],
      },
    ],
    invalid: [
      // Large payload in startChild
      {
        code: `
          await startChild(myWorkflow, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        `,
        options: [{ maxArrayElements: 10 }],
        errors: [
          {
            messageId: 'largeArrayPayload',
          },
        ],
      },

      // Large payload in executeChild
      {
        code: `
          await executeChild(myWorkflow, { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 });
        `,
        options: [{ maxObjectProperties: 5 }],
        errors: [
          {
            messageId: 'largeObjectPayload',
          },
        ],
      },

      // Large string payload
      {
        code: `
          await startChild(myWorkflow, 'this is a very long string for testing');
        `,
        options: [{ maxStringLength: 20 }],
        errors: [{ messageId: 'largeStringPayload' }],
      },

      // Nested object counting
      {
        code: `
          await executeChild(myWorkflow, {
            a: { nested1: 1, nested2: 2 },
            b: { nested3: 3, nested4: 4 },
            c: 5
          });
        `,
        options: [{ maxObjectProperties: 5 }],
        errors: [
          {
            messageId: 'largeObjectPayload',
            data: { count: '7' }, // 3 top-level + 4 nested
          },
        ],
      },
    ],
  });
});
