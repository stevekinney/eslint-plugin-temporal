import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWorkerImport } from './no-worker-import.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-worker-import', () => {
  ruleTester.run('no-worker-import', noWorkerImport, {
    valid: [
      // @temporalio/workflow is allowed
      `import { proxyActivities, startChild } from '@temporalio/workflow';`,

      // @temporalio/common is allowed
      `import { ApplicationFailure } from '@temporalio/common';`,

      // @temporalio/client is allowed (separate rule)
      `import { Client } from '@temporalio/client';`,

      // Type imports from worker are allowed
      `import type { Worker, WorkerOptions } from '@temporalio/worker';`,

      // Other packages with "worker" in the name
      `import { something } from 'some-worker-lib';`,
    ],
    invalid: [
      // Basic import
      {
        code: `import { Worker } from '@temporalio/worker';`,
        errors: [{ messageId: 'noWorkerImport' }],
      },

      // Named imports
      {
        code: `import { Worker, bundleWorkflowCode } from '@temporalio/worker';`,
        errors: [{ messageId: 'noWorkerImport' }],
      },

      // Default import
      {
        code: `import Worker from '@temporalio/worker';`,
        errors: [{ messageId: 'noWorkerImport' }],
      },

      // Namespace import
      {
        code: `import * as worker from '@temporalio/worker';`,
        errors: [{ messageId: 'noWorkerImport' }],
      },

      // Side effect import
      {
        code: `import '@temporalio/worker';`,
        errors: [{ messageId: 'noWorkerImport' }],
      },
    ],
  });
});
