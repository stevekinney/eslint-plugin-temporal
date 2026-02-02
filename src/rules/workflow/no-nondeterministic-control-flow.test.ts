import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noNondeterministicControlFlow } from './no-nondeterministic-control-flow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-nondeterministic-control-flow', () => {
  ruleTester.run('no-nondeterministic-control-flow', noNondeterministicControlFlow, {
    valid: [
      `if (isReady) {
        doWork();
      }`,
      `// temporal-deterministic
      if (Math.random() > 0.5) {
        doWork();
      }`,
      `/* temporal-deterministic */
      while (Date.now() < end) {
        doWork();
      }`,
      `// temporal-deterministic
       if (Math.random() > 0.5) {
         doWork();
       }`,
    ],
    invalid: [
      {
        code: `if (Math.random() > 0.5) {
          doWork();
        }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `while (Date.now() < end) {
          doWork();
        }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `switch (Math.random()) {
          case 0.5:
            doWork();
            break;
        }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `const result = Math.random() > 0.5 ? doA() : doB();`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
    ],
  });
});
