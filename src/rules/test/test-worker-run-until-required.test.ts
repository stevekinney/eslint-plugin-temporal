import { describe } from 'bun:test';

import { createTestRuleTester } from '../../test-utilities/rule-tester.ts';
import { testWorkerRunUntilRequired } from './test-worker-run-until-required.ts';

const ruleTester = createTestRuleTester();

describe('test-worker-run-until-required', () => {
  ruleTester.run('test-worker-run-until-required', testWorkerRunUntilRequired, {
    valid: [
      `import { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createLocal();
       const worker = await Worker.create({ workflowsPath: '/tmp/workflows' });
       await worker.runUntil(env, async () => {});
      `,
      `import { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createTimeSkipping();
       await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(env, async () => {});
      `,
      `import { Worker } from '@temporalio/worker';
       Worker.runReplayHistories({ workflowsPath: '/tmp/workflows', histories: [] });
      `,
    ],
    invalid: [
      {
        code: `import { Worker } from '@temporalio/worker';
          await Worker.create({ workflowsPath: '/tmp/workflows' });`,
        errors: [
          {
            messageId: 'runUntilRequired',
            suggestions: [
              {
                messageId: 'useRunUntil',
                output: `import { Worker } from '@temporalio/worker';
          await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(async () => { /* TODO: run workflow */ });`,
              },
            ],
          },
        ],
      },
      {
        code: `import { Worker } from '@temporalio/worker';
          const worker = await Worker.create({ workflowsPath: '/tmp/workflows' });
          await worker.run();`,
        errors: [
          {
            messageId: 'runUntilRequired',
            suggestions: [
              {
                messageId: 'useRunUntil',
                output: `import { Worker } from '@temporalio/worker';
          const worker = await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(async () => { /* TODO: run workflow */ });
          await worker.run();`,
              },
            ],
          },
        ],
      },
    ],
  });
});
