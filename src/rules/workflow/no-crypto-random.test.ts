import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noCryptoRandom } from './no-crypto-random.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-crypto-random', () => {
  ruleTester.run('no-crypto-random', noCryptoRandom, {
    valid: [
      // crypto.randomUUID is handled by a separate rule
      `const id = crypto.randomUUID();`,

      // Non-crypto objects with same method names
      `myModule.randomBytes(16);`,

      // Other crypto methods
      `crypto.createHash('sha256');`,

      // Not a call expression
      `const method = crypto.randomBytes;`,

      // Nested property access (not direct crypto.X)
      `node.crypto.randomBytes(16);`,
    ],
    invalid: [
      // crypto.randomBytes
      {
        code: `const bytes = crypto.randomBytes(16);`,
        errors: [{ messageId: 'noCryptoRandom' }],
      },

      // crypto.getRandomValues
      {
        code: `crypto.getRandomValues(new Uint8Array(16));`,
        errors: [{ messageId: 'noCryptoRandom' }],
      },

      // crypto.randomFillSync
      {
        code: `crypto.randomFillSync(buffer);`,
        errors: [{ messageId: 'noCryptoRandom' }],
      },

      // Inside a function
      {
        code: `function generate() { return crypto.getRandomValues(new Uint8Array(32)); }`,
        errors: [{ messageId: 'noCryptoRandom' }],
      },
    ],
  });
});
