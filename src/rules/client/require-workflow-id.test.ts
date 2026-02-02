import { describe } from 'bun:test';

import { createClientRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireWorkflowId } from './require-workflow-id.ts';

const ruleTester = createClientRuleTester();

describe('require-workflow-id', () => {
  ruleTester.run('require-workflow-id', requireWorkflowId, {
    valid: [
      // With workflowId
      `client.workflow.start(myWorkflow, { workflowId: 'order-123' });`,
      `client.workflow.start(myWorkflow, { workflowId: orderId, taskQueue: 'main' });`,
      `await client.workflow.execute(myWorkflow, { workflowId: \`user-\${userId}\` });`,

      // WorkflowClient patterns
      `workflowClient.start(myWorkflow, { workflowId: 'wf-1' });`,

      // signalWithStart with workflowId
      `client.workflow.signalWithStart(myWorkflow, { workflowId: 'wf-1', signal: mySignal });`,

      // Not a workflow start call
      `someObject.start(workflow, {});`,
      `client.activity.execute(activity, {});`,
      `doSomething();`,

      // Variable options (can't statically check)
      `client.workflow.start(myWorkflow, options);`,
    ],
    invalid: [
      // Missing workflowId in client.workflow.start
      {
        code: `client.workflow.start(myWorkflow, { taskQueue: 'main' });`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },

      // Missing workflowId in client.workflow.execute
      {
        code: `await client.workflow.execute(myWorkflow, { taskQueue: 'main' });`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },

      // Empty options
      {
        code: `client.workflow.start(myWorkflow, {});`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },

      // No options at all
      {
        code: `client.workflow.start(myWorkflow);`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },

      // signalWithStart without workflowId
      {
        code: `client.workflow.signalWithStart(myWorkflow, { signal: mySignal });`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },

      // WorkflowClient without workflowId
      {
        code: `workflowClient.start(myWorkflow, { taskQueue: 'tasks' });`,
        errors: [{ messageId: 'missingWorkflowId' }],
      },
    ],
  });
});
