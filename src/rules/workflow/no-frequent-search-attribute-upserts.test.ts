import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noFrequentSearchAttributeUpserts } from './no-frequent-search-attribute-upserts.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-frequent-search-attribute-upserts', () => {
  ruleTester.run(
    'no-frequent-search-attribute-upserts',
    noFrequentSearchAttributeUpserts,
    {
      valid: [
        `upsertSearchAttributes({ OrderId: [orderId] });`,
        `for (const item of items) { process(item); }`,
      ],
      invalid: [
        {
          code: `for (const item of items) {
            upsertSearchAttributes({ Item: [item] });
          }`,
          errors: [{ messageId: 'avoidFrequentUpserts' }],
        },
        {
          code: `while (true) {
            upsertSearchAttributes({ Status: ['running'] });
            break;
          }`,
          errors: [{ messageId: 'avoidFrequentUpserts' }],
        },
        {
          code: `do {
            upsertSearchAttributes({ Status: ['running'] });
          } while (shouldContinue);`,
          errors: [{ messageId: 'avoidFrequentUpserts' }],
        },
        {
          code: `for (let i = 0; i < items.length; i++) {
            upsertSearchAttributes({ Index: [i] });
          }`,
          errors: [{ messageId: 'avoidFrequentUpserts' }],
        },
      ],
    },
  );
});
