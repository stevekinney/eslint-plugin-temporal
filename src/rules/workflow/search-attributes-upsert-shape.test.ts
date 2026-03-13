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
      // Computed property access (bracket notation) for upsertSearchAttributes
      `workflow['upsertSearchAttributes']({ OrderId: [orderId] });`,
      // Non-object argument (e.g., variable reference)
      `upsertSearchAttributes(attrs);`,
      // Spread element in properties (not a Property node)
      `upsertSearchAttributes({ ...defaults, OrderId: ['abc'] });`,
      // Optional chaining value (ChainExpression unwrap, lines 46-47, 50)
      `upsertSearchAttributes({ OrderId: foo?.getStatuses() });`,
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
      // Bracket notation callee for upsertSearchAttributes with invalid value
      {
        code: `workflow['upsertSearchAttributes']({ OrderId: 'abc' });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // TSAsExpression unwrapping
      {
        code: `upsertSearchAttributes({ OrderId: 'abc' as any });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // TSNonNullExpression unwrapping
      {
        code: `upsertSearchAttributes({ OrderId: null! });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // Template literal value
      {
        code: 'upsertSearchAttributes({ OrderId: `template` });',
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // void expression value
      {
        code: `upsertSearchAttributes({ OrderId: void 0 });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // new expression value
      {
        code: `upsertSearchAttributes({ OrderId: new Set() });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // class expression value
      {
        code: `upsertSearchAttributes({ OrderId: class {} });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
      // function expression value
      {
        code: `upsertSearchAttributes({ OrderId: function() {} });`,
        errors: [{ messageId: 'invalidSearchAttributeValue' }],
      },
    ],
  });
});
