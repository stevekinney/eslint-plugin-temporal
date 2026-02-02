import { describe } from 'bun:test';

import { createTestRuleTester } from '../../test-utilities/rule-tester.ts';
import { testWorkerRunUntilRequired } from './test-worker-run-until-required.ts';

const ruleTester = createTestRuleTester();

describe('test-worker-run-until-required', () => {
  ruleTester.run('test-worker-run-until-required', testWorkerRunUntilRequired, {
    valid: [
      // Worker with runUntil
      `import { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createLocal();
       const worker = await Worker.create({ workflowsPath: '/tmp/workflows' });
       await worker.runUntil(env, async () => {});
      `,
      // Chained runUntil
      `import { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createTimeSkipping();
       await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(env, async () => {});
      `,
      // Replay histories - no runUntil needed
      `import { Worker } from '@temporalio/worker';
       Worker.runReplayHistories({ workflowsPath: '/tmp/workflows', histories: [] });
      `,
      // Type-only import - should not trigger rule
      `import type { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createLocal();
      `,
      // Worker with runUntil chained inline
      `import { Worker } from '@temporalio/worker';
       import { TestWorkflowEnvironment } from '@temporalio/testing';
       const env = await TestWorkflowEnvironment.createLocal();
       await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(async () => {});
      `,
    ],
    invalid: [
      // Worker.create without runUntil
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
      // Worker stored then run() called
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
      // Namespace import
      {
        code: `import * as temporal from '@temporalio/worker';
          await temporal.Worker.create({ workflowsPath: '/tmp/workflows' });`,
        errors: [
          {
            messageId: 'runUntilRequired',
            suggestions: [
              {
                messageId: 'useRunUntil',
                output: `import * as temporal from '@temporalio/worker';
          await temporal.Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(async () => { /* TODO: run workflow */ });`,
              },
            ],
          },
        ],
      },
      // Assignment expression
      {
        code: `import { Worker } from '@temporalio/worker';
          let worker;
          worker = await Worker.create({ workflowsPath: '/tmp/workflows' });`,
        errors: [
          {
            messageId: 'runUntilRequired',
            suggestions: [
              {
                messageId: 'useRunUntil',
                output: `import { Worker } from '@temporalio/worker';
          let worker;
          worker = await Worker.create({ workflowsPath: '/tmp/workflows' }).runUntil(async () => { /* TODO: run workflow */ });`,
              },
            ],
          },
        ],
      },
    ],
  });
});
