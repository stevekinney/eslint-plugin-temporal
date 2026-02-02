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
    ],
  });
});
