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
      // NewExpression that is not Date (line 83 — falls through NewExpression check)
      `if (new Map()) { doWork(); }`,
      // CallExpression with computed member callee (line 74 — falls through MemberExpression check)
      `if (obj['method']()) { doWork(); }`,
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
      {
        code: `if (uuid4()) { doWork(); }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `if (new Date() > x) { doWork(); }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `do { doWork(); } while (Math.random() > 0.5)`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `if (crypto.randomUUID()) { doWork(); }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      {
        code: `for (let i = 0; Date.now() < end; i++) { doWork(); }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
      // Nondeterminism inside a call argument (array child walk, lines 99-101)
      {
        code: `if (fn(Math.random())) { doWork(); }`,
        errors: [{ messageId: 'nondeterministicControlFlow' }],
      },
    ],
  });
});
