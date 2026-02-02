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
      {
        code: `const smallArray = [1, 2, 3];
const smallObject = { a: 1, b: 2, c: 3 };
const smallString = 'short';`,
        options,
      },
    ],
    invalid: [
      {
        code: `const bigArray = [1, 2, 3, 4];`,
        options,
        errors: [{ messageId: 'largeArrayConstant' }],
      },
      {
        code: `const bigObject = { a: 1, b: 2, c: 3, d: 4 };`,
        options,
        errors: [{ messageId: 'largeObjectConstant' }],
      },
      {
        code: `const bigString = '12345678901';`,
        options,
        errors: [{ messageId: 'largeStringConstant' }],
      },
    ],
  });
});
