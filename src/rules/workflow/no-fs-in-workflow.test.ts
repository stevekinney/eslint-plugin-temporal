import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noFsInWorkflow } from './no-fs-in-workflow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-fs-in-workflow', () => {
  ruleTester.run('no-fs-in-workflow', noFsInWorkflow, {
    valid: [
      `import { log } from '@temporalio/workflow';
       log.info('ok');`,
      `const filePath = '/tmp/file.txt';`,
      `import type { Stats } from 'fs';
       export type { Stats };`,
    ],
    invalid: [
      {
        code: `import fs from 'fs';`,
        errors: [{ messageId: 'noFs' }],
      },
      {
        code: `import { readFile } from 'node:fs/promises';`,
        errors: [{ messageId: 'noFs' }],
      },
      {
        code: `import { glob } from 'glob';`,
        errors: [{ messageId: 'noFs' }],
      },
      {
        code: `const fs = require('fs');`,
        errors: [{ messageId: 'noFs' }],
      },
    ],
  });
});
