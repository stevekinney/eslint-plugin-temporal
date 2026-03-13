import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noLargeInlineConstants } from './no-large-inline-constants.ts';

const ruleTester = createWorkflowRuleTester();

const options: [
  {
    maxArrayElements: number;
    maxObjectProperties: number;
    maxStringLength: number;
  },
] = [
  {
    maxArrayElements: 3,
    maxObjectProperties: 3,
    maxStringLength: 10,
  },
];

describe('no-large-inline-constants', () => {
  ruleTester.run('no-large-inline-constants', noLargeInlineConstants, {
    valid: [
      // Small arrays, objects, strings
      {
        code: `const smallArray = [1, 2, 3];
const smallObject = { a: 1, b: 2, c: 3 };
const smallString = 'short';`,
        options,
      },
      // Not top-level - inside function
      {
        code: `function inner() { const arr = [1, 2, 3, 4, 5]; }`,
        options,
      },
      // Export default with non-string literal
      {
        code: `export default 123;`,
        options,
      },
      // Array with spread (counts as 1 element)
      {
        code: `const arr = [1, 2, ...rest];`,
        options,
      },
      // Variable reference (not a literal)
      {
        code: `const data = someVariable;`,
        options,
      },
      // Template literal under limit
      {
        code: 'const str = `short`;',
        options,
      },
      // Export default with non-literal/non-object/non-array (e.g., function — lines 203-204)
      {
        code: `export default function() { return [1, 2, 3, 4]; };`,
        options,
      },
      // Export default with identifier reference (lines 203-204)
      {
        code: `export default someVariable;`,
        options,
      },
      // Optional chaining value (ChainExpression unwrap, lines 68-69)
      {
        code: `const data = config?.getValue();`,
        options,
      },
    ],
    invalid: [
      // Large array
      {
        code: `const bigArray = [1, 2, 3, 4];`,
        options,
        errors: [{ messageId: 'largeArrayConstant' }],
      },
      // Large object
      {
        code: `const bigObject = { a: 1, b: 2, c: 3, d: 4 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },
      // Large string
      {
        code: `const bigString = '12345678901';`,
        options,
        errors: [{ messageId: 'largeStringConstant' }],
      },
      // Sparse array (null slots count as elements)
      {
        code: `const sparse = [1, , , 4];`,
        options,
        errors: [{ messageId: 'largeArrayConstant' }],
      },
      // Export const with large value
      {
        code: `export const data = { a: 1, b: 2, c: 3, d: 4 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },
      // Template literal over limit
      {
        code: 'const str = `12345678901`;',
        options,
        errors: [{ messageId: 'largeStringConstant' }],
      },
      // Nested array counting
      {
        code: `const nested = [[1, 2], [3, 4]];`,
        options: [{ maxArrayElements: 5, maxObjectProperties: 3, maxStringLength: 10 }],
        errors: [{ messageId: 'largeArrayConstant' }],
      },
      // Export default large object
      {
        code: `export default { a: 1, b: 2, c: 3, d: 4 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },
      // Export default large array
      {
        code: `export default [1, 2, 3, 4];`,
        options,
        errors: [{ messageId: 'largeArrayConstant' }],
      },
      // TypeScript type assertion unwrapping
      {
        code: `const data = { a: 1, b: 2, c: 3, d: 4 } as const;`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },

      // Object with spread elements (covers countObjectProperties SpreadElement branch, lines 27-28)
      {
        code: `const data = { a: 1, b: 2, ...rest, d: 4 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },

      // Nested object property counting (covers countObjectProperties nested call, line 25)
      {
        code: `const data = { a: { x: 1, y: 2 }, b: 3 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },

      // TSNonNullExpression unwrapping (covers unwrapExpression TSNonNullExpression, lines 63-64)
      {
        code: `const data = [1, 2, 3, 4]!;`,
        options,
        errors: [{ messageId: 'largeArrayConstant' }],
      },

      // Export default large string
      {
        code: `export default '12345678901';`,
        options,
        errors: [{ messageId: 'largeStringConstant' }],
      },

      // Export default large template literal
      {
        code: 'export default `12345678901`;',
        options,
        errors: [{ messageId: 'largeStringConstant' }],
      },
    ],
  });
});
