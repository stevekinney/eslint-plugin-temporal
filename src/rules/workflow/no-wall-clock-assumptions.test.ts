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
    ],
  });
});
