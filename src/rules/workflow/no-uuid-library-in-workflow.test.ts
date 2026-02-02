import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noUuidLibraryInWorkflow } from './no-uuid-library-in-workflow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-uuid-library-in-workflow', () => {
  ruleTester.run('no-uuid-library-in-workflow', noUuidLibraryInWorkflow, {
    valid: [
      `import { uuid4 } from '@temporalio/workflow';
       const id = uuid4();`,
      `import type { v4 } from 'uuid';
       export type { v4 };`,
    ],
    invalid: [
      {
        code: `import { v4 } from 'uuid';`,
        errors: [{ messageId: 'noUuidLibrary' }],
      },
      {
        code: `import nanoid from 'nanoid';`,
        errors: [{ messageId: 'noUuidLibrary' }],
      },
      {
        code: `const cuid = require('cuid');`,
        errors: [{ messageId: 'noUuidLibrary' }],
      },
      {
        code: `import { ulid } from 'ulid';`,
        errors: [{ messageId: 'noUuidLibrary' }],
      },
    ],
  });
});
