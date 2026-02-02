import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { searchAttributesUpsertShape } from './search-attributes-upsert-shape.ts';

const ruleTester = createWorkflowRuleTester();

describe('search-attributes-upsert-shape', () => {
  ruleTester.run('search-attributes-upsert-shape', searchAttributesUpsertShape, {
    valid: [
      `upsertSearchAttributes({ OrderId: [orderId], Status: ['active'] });`,
      `upsertSearchAttributes({ OrderId: [] });`,
      `upsertSearchAttributes({ OrderIds: orderIds });`,
      `workflow.upsertSearchAttributes({ Status: getStatuses() });`,
      `upsertSearchAttributes({ Status: maybeStatuses ?? [] });`,
      `upsertSearchAttributes();`,
    ],
    invalid: [
      {
        code: `upsertSearchAttributes({ OrderId: 'abc' });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      {
        code: `upsertSearchAttributes({ OrderId: 123 });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      {
        code: `upsertSearchAttributes({ OrderId: null });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      {
        code: `upsertSearchAttributes({ OrderId: undefined });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      {
        code: `upsertSearchAttributes({ OrderId: { value: 'a' } });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      {
        code: `upsertSearchAttributes({ OrderId: () => 'x' });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
    ],
  });
});
