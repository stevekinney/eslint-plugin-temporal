import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noCryptoRandomUuid } from './no-crypto-random-uuid.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-crypto-random-uuid', () => {
  ruleTester.run('no-crypto-random-uuid', noCryptoRandomUuid, {
    valid: [
      // Using uuid4 from @temporalio/workflow
      `import { uuid4 } from '@temporalio/workflow';
       const id = uuid4();`,

      // Other crypto methods are fine (handled by other rules)
      `const hash = crypto.createHash('sha256');`,

      // Different object named crypto
      `const myCrypto = { randomUUID: () => 'custom' };
       const id = myCrypto.randomUUID();`,

      // Standalone function named randomUUID
      `const randomUUID = () => 'custom';
       const id = randomUUID();`,
    ],
    invalid: [
      // Basic crypto.randomUUID()
      {
        code: `const id = crypto.randomUUID();`,
        output: `import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'noCryptoRandomUuid' }],
      },

      // With existing Temporal import
      {
        code: `import { proxyActivities } from '@temporalio/workflow';
const id = crypto.randomUUID();`,
        output: `import { proxyActivities, uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'noCryptoRandomUuid' }],
      },

      // With uuid4 already imported
      {
        code: `import { uuid4 } from '@temporalio/workflow';
const id = crypto.randomUUID();`,
        output: `import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'noCryptoRandomUuid' }],
      },

      // Multiple usages
      {
        code: `const id1 = crypto.randomUUID();
const id2 = crypto.randomUUID();`,
        output: [
          `import { uuid4 } from '@temporalio/workflow';
const id1 = uuid4();
const id2 = crypto.randomUUID();`,
          `import { uuid4 } from '@temporalio/workflow';
const id1 = uuid4();
const id2 = uuid4();`,
        ],
        errors: [
          { messageId: 'noCryptoRandomUuid' },
          { messageId: 'noCryptoRandomUuid' },
        ],
      },

      // In function call
      {
        code: `saveId(crypto.randomUUID());`,
        output: `import { uuid4 } from '@temporalio/workflow';
saveId(uuid4());`,
        errors: [{ messageId: 'noCryptoRandomUuid' }],
      },
    ],
  });
});
