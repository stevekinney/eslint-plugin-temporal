import { describe } from 'bun:test';

import {
  createTestRuleTester,
  createWorkflowRuleTester,
} from '../../test-utilities/rule-tester.ts';
import { noAssertInProductionWorkflow } from './no-assert-in-production-workflow.ts';

const workflowTester = createWorkflowRuleTester();
const testTester = createTestRuleTester();

describe('no-assert-in-production-workflow', () => {
  workflowTester.run('no-assert-in-production-workflow', noAssertInProductionWorkflow, {
    valid: [`import { log } from '@temporalio/workflow'; log.info('ok');`],
    invalid: [
      {
        code: `import assert from 'assert';`,
        errors: [{ messageId: 'noAssertInWorkflow' }],
      },
      {
        code: `import { strict as assert } from 'node:assert';`,
        errors: [{ messageId: 'noAssertInWorkflow' }],
      },
      {
        code: `const assert = require('assert');`,
        errors: [{ messageId: 'noAssertInWorkflow' }],
      },
    ],
  });

  testTester.run(
    'no-assert-in-production-workflow (tests)',
    noAssertInProductionWorkflow,
    {
      valid: [
        `import assert from 'assert';
       assert.ok(true);`,
      ],
      invalid: [],
    },
  );
});
