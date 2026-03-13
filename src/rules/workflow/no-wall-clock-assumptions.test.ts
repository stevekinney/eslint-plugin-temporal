import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWallClockAssumptions } from './no-wall-clock-assumptions.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-wall-clock-assumptions', () => {
  ruleTester.run('no-wall-clock-assumptions', noWallClockAssumptions, {
    valid: [
      `if (Date.now() > 0) {
        doWork();
      }`,
      `const start = Date.now();
       if (Date.now() > start) {
         doWork();
       }`,
      `const now = Date.now();
       const deadline = now + 1000;
       if (Date.now() > deadline) {
         doWork();
       }`,
      `const timing = { start: Date.now() }; if (Date.now() > timing.start) {}`,
      `function check() { const start = Date.now(); if (Date.now() > start) {} }`,
      `const check = () => { const start = Date.now(); if (Date.now() > start) {} }`,
      // FunctionExpression: derived time scoped correctly
      `const check = function() { const start = Date.now(); if (Date.now() > start) {} }`,
      // Derived time via assignment expression
      `let start; start = Date.now(); if (Date.now() > start) {}`,
      // Comparison of Date.now() on the right side against derived time
      `const start = Date.now(); if (start < Date.now()) {}`,
      // Non-comparison operator should be ignored
      `const x = Date.now() + externalValue;`,
    ],
    invalid: [
      {
        code: `if (Date.now() > input.deadline) {
          doWork();
        }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
      {
        code: `const deadline = input.deadline;
        if (Date.now() > deadline) {
          doWork();
        }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
      {
        code: `const deadline = getDeadline();
        if (Date.now() > deadline) {
          doWork();
        }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
      {
        code: `if (Date['now']() > externalDeadline) { doWork(); }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
      // FunctionExpression scope: derived time from outer scope NOT visible inside function
      {
        code: `const start = Date.now();
        const check = function() { if (Date.now() > externalDeadline) { doWork(); } }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
      // ArrowFunctionExpression scope: derived time from outer scope NOT visible inside arrow
      {
        code: `const start = Date.now();
        const check = () => { if (Date.now() > externalDeadline) { doWork(); } }`,
        errors: [{ messageId: 'wallClockAssumption' }],
      },
    ],
  });
});
