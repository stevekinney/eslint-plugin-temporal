import { describe } from 'bun:test';

import { createTestRuleTester } from '../../test-utilities/rule-tester.ts';
import { testTeardownRequired } from './test-teardown-required.ts';

const ruleTester = createTestRuleTester();

describe('test-teardown-required', () => {
  ruleTester.run('test-teardown-required', testTeardownRequired, {
    valid: [
      `import { TestWorkflowEnvironment } from '@temporalio/testing';
       let testEnv;
       beforeAll(async () => {
         testEnv = await TestWorkflowEnvironment.createTimeSkipping();
       });
       afterAll(async () => {
         await testEnv.teardown();
       });`,

      `import { TestWorkflowEnvironment } from '@temporalio/testing';
       const { teardown } = await TestWorkflowEnvironment.createLocal();
       afterEach(async () => {
         await teardown();
       });`,

      `import * as testing from '@temporalio/testing';
       let env;
       beforeAll(async () => {
         env = await testing.TestWorkflowEnvironment.createLocal();
       });
       afterAll(async () => {
         await env.teardown();
       });`,

      `afterAll(() => {
         cleanup();
       });`,
    ],
    invalid: [
      {
        code: `import { TestWorkflowEnvironment } from '@temporalio/testing';
          let testEnv;
          beforeAll(async () => {
            testEnv = await TestWorkflowEnvironment.createTimeSkipping();
          });`,
        errors: [
          {
            messageId: 'teardownRequired',
            suggestions: [
              {
                messageId: 'addTeardownHook',
                output: `import { TestWorkflowEnvironment } from '@temporalio/testing';
          let testEnv;
          beforeAll(async () => {
            testEnv = await TestWorkflowEnvironment.createTimeSkipping();
          });

afterAll(async () => {
  await testEnv.teardown();
});`,
              },
            ],
          },
        ],
      },
      {
        code: `import { TestWorkflowEnvironment } from '@temporalio/testing';
          const env = await TestWorkflowEnvironment.createLocal();
          env.teardown();`,
        errors: [
          {
            messageId: 'teardownRequired',
            suggestions: [
              {
                messageId: 'addTeardownHook',
                output: `import { TestWorkflowEnvironment } from '@temporalio/testing';
          const env = await TestWorkflowEnvironment.createLocal();
          env.teardown();

afterAll(async () => {
  await env.teardown();
});`,
              },
            ],
          },
        ],
      },
    ],
  });
});
