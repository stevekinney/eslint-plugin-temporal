import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { taskQueueConstant } from './task-queue-constant.ts';

const ruleTester = createBasicRuleTester();

describe('task-queue-constant', () => {
  ruleTester.run('task-queue-constant', taskQueueConstant, {
    valid: [
      // Using constant
      `client.workflow.start(myWorkflow, { taskQueue: TASK_QUEUE });`,
      `Worker.create({ taskQueue: config.taskQueue });`,

      // Using imported constant
      `import { TASK_QUEUE } from './constants';
       client.workflow.start(myWorkflow, { taskQueue: TASK_QUEUE });`,

      // Using variable
      `const queue = getTaskQueue();
       client.workflow.start(myWorkflow, { taskQueue: queue });`,

      // Template with expression (dynamic)
      `client.workflow.start(myWorkflow, { taskQueue: \`queue-\${env}\` });`,

      // Not taskQueue property
      `const config = { queue: 'my-queue' };`,
    ],
    invalid: [
      // String literal in workflow start
      {
        code: `client.workflow.start(myWorkflow, { taskQueue: 'my-queue' });`,
        errors: [{ messageId: 'taskQueueShouldBeConstant' }],
      },

      // String literal in worker
      {
        code: `Worker.create({ taskQueue: 'worker-queue' });`,
        errors: [{ messageId: 'taskQueueShouldBeConstant' }],
      },

      // Double quoted string
      {
        code: `Worker.create({ taskQueue: "my-queue" });`,
        errors: [{ messageId: 'taskQueueShouldBeConstant' }],
      },

      // Template literal without expressions
      {
        code: `Worker.create({ taskQueue: \`static-queue\` });`,
        errors: [{ messageId: 'taskQueueShouldBeConstant' }],
      },

      // In proxyActivities
      {
        code: `proxyActivities({ taskQueue: 'activity-queue' });`,
        errors: [{ messageId: 'taskQueueShouldBeConstant' }],
      },
    ],
  });
});
