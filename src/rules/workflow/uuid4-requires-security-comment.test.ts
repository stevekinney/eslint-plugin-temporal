import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { uuid4RequiresSecurityComment } from './uuid4-requires-security-comment.ts';

const ruleTester = createWorkflowRuleTester();

describe('uuid4-requires-security-comment', () => {
  ruleTester.run('uuid4-requires-security-comment', uuid4RequiresSecurityComment, {
    valid: [
      `import { uuid4 } from '@temporalio/workflow';
       // uuid4 is deterministic and not secure
       const id = uuid4();`,
      `import { uuid4 as createId } from '@temporalio/workflow';
       /* temporal-uuid4 */
       const id = createId();`,
      `import * as workflow from '@temporalio/workflow';
       const id = workflow.uuid4(); // uuid4 deterministic, not secure`,
    ],
    invalid: [
      {
        code: `import { uuid4 } from '@temporalio/workflow';
const id = uuid4();`,
        errors: [{ messageId: 'uuid4RequiresComment' }],
      },
      {
        code: `import * as workflow from '@temporalio/workflow';
const id = workflow.uuid4();`,
        errors: [{ messageId: 'uuid4RequiresComment' }],
      },
    ],
  });
});
