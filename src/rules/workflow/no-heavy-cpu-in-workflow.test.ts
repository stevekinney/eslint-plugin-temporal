import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noHeavyCpuInWorkflow } from './no-heavy-cpu-in-workflow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-heavy-cpu-in-workflow', () => {
  ruleTester.run('no-heavy-cpu-in-workflow', noHeavyCpuInWorkflow, {
    valid: [
      `for (let i = 0; i < 100; i += 1) {
        total += i;
      }`,
      `for (let i = 0; i < 20000; i += 1) {
        await doWork();
      }`,
      `const digest = createDigest(data);`,
    ],
    invalid: [
      {
        code: `for (let i = 0; i < 20000; i += 1) {
          total += i;
        }`,
        errors: [{ messageId: 'heavyCpu' }],
      },
      {
        code: `crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');`,
        errors: [{ messageId: 'heavyCpu' }],
      },
      {
        code: `bcrypt.hashSync('secret', 10);`,
        errors: [{ messageId: 'heavyCpu' }],
      },

      // Loop with >= operator (reverse loop with large literal on left)
      {
        code: `for (let i = 0; 10000 >= i; i += 1) {
          total += i;
        }`,
        errors: [{ messageId: 'heavyCpu' }],
      },

      // Loop with > operator (literal on left)
      {
        code: `for (let i = 0; 20000 > i; i += 1) {
          total += i;
        }`,
        errors: [{ messageId: 'heavyCpu' }],
      },

      // Chained member expression calling a heavy function
      {
        code: `crypto.subtle.pbkdf2Sync(password, salt, 1000, 64, 'sha512');`,
        errors: [{ messageId: 'heavyCpu' }],
      },

      // Direct call to heavy identifier function
      {
        code: `createHash('sha256');`,
        errors: [{ messageId: 'heavyCpu' }],
      },

      // Loop with <= operator at threshold
      {
        code: `for (let i = 0; i <= 10000; i += 1) {
          total += i;
        }`,
        errors: [{ messageId: 'heavyCpu' }],
      },
    ],
  });
});
