import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noProcessEnv } from './no-process-env.ts';

const ruleTester = createBasicRuleTester();

describe('no-process-env', () => {
  ruleTester.run('no-process-env', noProcessEnv, {
    valid: [
      // Accessing other process properties
      `const pid = process.pid;`,

      // Environment passed as argument
      `export async function myWorkflow(config: { apiUrl: string }) {
        const url = config.apiUrl;
      }`,

      // Different object named process
      `const myProcess = { env: { KEY: 'value' } };
       const key = myProcess.env.KEY;`,

      // env object from different source
      `const env = { KEY: 'value' };
       const key = env.KEY;`,
    ],
    invalid: [
      // Direct property access
      {
        code: `const apiKey = process.env.API_KEY;`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // Bracket notation
      {
        code: `const apiKey = process.env['API_KEY'];`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // Accessing process.env directly
      {
        code: `const env = process.env;`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // In conditional
      {
        code: `if (process.env.NODE_ENV === 'production') { doSomething(); }`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // Destructuring pattern
      {
        code: `const { API_KEY } = process.env;`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // In function call
      {
        code: `fetch(process.env.API_URL);`,
        errors: [{ messageId: 'noProcessEnv' }],
      },

      // Multiple usages
      {
        code: `const a = process.env.A;
               const b = process.env.B;`,
        errors: [{ messageId: 'noProcessEnv' }, { messageId: 'noProcessEnv' }],
      },
    ],
  });
});
