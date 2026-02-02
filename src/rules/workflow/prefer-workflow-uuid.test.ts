import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferWorkflowUuid } from './prefer-workflow-uuid.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-workflow-uuid', () => {
  ruleTester.run('prefer-workflow-uuid', preferWorkflowUuid, {
    valid: [
      // Using Temporal's uuid4
      `import { uuid4 } from '@temporalio/workflow';
       const id = uuid4();`,

      // Not calling uuid functions
      `import { v4 } from 'uuid';
       const fn = v4;`,

      // Unrelated function calls
      `const id = generateId();`,
      `const result = v4.something();`,

      // Different library with same name
      `import { v4 } from 'my-uuid-lib';
       const id = v4();`,
    ],
    invalid: [
      // uuid.v4()
      {
        code: `import * as uuid from 'uuid';
const id = uuid.v4();`,
        output: `import * as uuid from 'uuid';
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },

      // Named import v4()
      {
        code: `import { v4 } from 'uuid';
const id = v4();`,
        output: `import { v4 } from 'uuid';
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },

      // Renamed import
      {
        code: `import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();`,
        output: `import { v4 as uuidv4 } from 'uuid';
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },

      // nanoid
      {
        code: `import { nanoid } from 'nanoid';
const id = nanoid();`,
        output: `import { nanoid } from 'nanoid';
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },

      // crypto.randomUUID
      {
        code: `import { randomUUID } from 'crypto';
const id = randomUUID();`,
        output: `import { randomUUID } from 'crypto';
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },

      // With existing Temporal import
      {
        code: `import { proxyActivities } from '@temporalio/workflow';
import { v4 } from 'uuid';
const id = v4();`,
        output: `import { proxyActivities, uuid4 } from '@temporalio/workflow';
import { v4 } from 'uuid';
const id = uuid4();`,
        errors: [{ messageId: 'preferWorkflowUuid' }],
      },
    ],
  });
});
