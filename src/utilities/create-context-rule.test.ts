import {
  activityFile,
  clientFile,
  createBasicRuleTester,
  workerFile,
  workflowFile,
} from '../test-utilities/rule-tester.ts';
import {
  createActivityRule,
  createClientRule,
  createWorkerRule,
  createWorkflowRule,
} from './create-context-rule.ts';

// Simple test rule that reports on all identifiers named "forbidden"
const testWorkflowRule = createWorkflowRule({
  name: 'test-workflow-rule',
  meta: {
    type: 'problem',
    docs: {
      description: 'Test rule for workflow context',
    },
    messages: {
      forbidden: 'Found forbidden identifier',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'forbidden') {
          context.report({
            node,
            messageId: 'forbidden',
          });
        }
      },
    };
  },
});

const testActivityRule = createActivityRule({
  name: 'test-activity-rule',
  meta: {
    type: 'problem',
    docs: {
      description: 'Test rule for activity context',
    },
    messages: {
      forbidden: 'Found forbidden identifier in activity',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'forbidden') {
          context.report({
            node,
            messageId: 'forbidden',
          });
        }
      },
    };
  },
});

const testWorkerRule = createWorkerRule({
  name: 'test-worker-rule',
  meta: {
    type: 'problem',
    docs: {
      description: 'Test rule for worker context',
    },
    messages: {
      forbidden: 'Found forbidden identifier in worker',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'forbidden') {
          context.report({
            node,
            messageId: 'forbidden',
          });
        }
      },
    };
  },
});

const testClientRule = createClientRule({
  name: 'test-client-rule',
  meta: {
    type: 'problem',
    docs: {
      description: 'Test rule for client context',
    },
    messages: {
      forbidden: 'Found forbidden identifier in client',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'forbidden') {
          context.report({
            node,
            messageId: 'forbidden',
          });
        }
      },
    };
  },
});

const ruleTester = createBasicRuleTester();

ruleTester.run('createWorkflowRule - import detection', testWorkflowRule, {
  valid: [
    // Non-workflow file (no Temporal imports) - should not report
    {
      code: `const forbidden = 'value';`,
      filename: '/project/src/utils/helpers.ts',
    },
    // Activity file (by imports) - should not report
    {
      code: `
        import { Context } from '@temporalio/activity';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
    },
    // Client file (by imports) - should not report
    {
      code: `
        import { Client } from '@temporalio/client';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
    },
  ],
  invalid: [
    // Workflow file (by imports) - should report
    {
      code: `
        import { proxyActivities } from '@temporalio/workflow';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Workflow file (by file path) - should report
    {
      code: `const forbidden = 'value';`,
      filename: workflowFile('my-workflow.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
    // Imports take priority over file path (activity path but workflow import)
    {
      code: `
        import { proxyActivities } from '@temporalio/workflow';
        const forbidden = 'value';
      `,
      filename: activityFile('not-actually-activity.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
    // Test file with workflow imports - should report (treatTestAsWorkflow: true by default)
    {
      code: `
        import { TestWorkflowEnvironment } from '@temporalio/testing';
        import { proxyActivities } from '@temporalio/workflow';
        const forbidden = 'value';
      `,
      filename: '/project/src/workflow.test.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Test file with only testing imports should still report (treatTestAsWorkflow: true)
    {
      code: `
        import { TestWorkflowEnvironment } from '@temporalio/testing';
        const forbidden = 'value';
      `,
      filename: '/project/src/workflow.test.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Custom file patterns should be honored
    {
      code: `const forbidden = 'value';`,
      filename: '/project/src/custom/workflow.ts',
      settings: {
        temporal: {
          filePatterns: {
            workflow: ['**/custom/**'],
          },
        },
      },
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});

ruleTester.run('createActivityRule - import detection', testActivityRule, {
  valid: [
    // Non-activity file (no Temporal imports) - should not report
    {
      code: `const forbidden = 'value';`,
      filename: '/project/src/utils/helpers.ts',
    },
    // Workflow file (by imports) - should not report
    {
      code: `
        import { proxyActivities } from '@temporalio/workflow';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
    },
  ],
  invalid: [
    // Activity file (by imports) - should report
    {
      code: `
        import { Context } from '@temporalio/activity';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Activity file (by file path) - should report
    {
      code: `const forbidden = 'value';`,
      filename: activityFile('send-email.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});

ruleTester.run('createWorkerRule - import detection', testWorkerRule, {
  valid: [
    // Non-worker file (no Temporal imports) - should not report
    {
      code: `const forbidden = 'value';`,
      filename: '/project/src/utils/helpers.ts',
    },
    // Workflow file (by imports) - should not report
    {
      code: `
        import { proxyActivities } from '@temporalio/workflow';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
    },
    // Test file with only testing imports should not report for worker rules
    {
      code: `
        import { TestWorkflowEnvironment } from '@temporalio/testing';
        const forbidden = 'value';
      `,
      filename: '/project/src/worker.test.ts',
    },
  ],
  invalid: [
    // Worker file (by imports) - should report
    {
      code: `
        import { Worker } from '@temporalio/worker';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Worker file (by file path) - should report
    {
      code: `const forbidden = 'value';`,
      filename: workerFile('main.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
    // Imports take priority over file path (workflow path but worker import)
    {
      code: `
        import { Worker } from '@temporalio/worker';
        const forbidden = 'value';
      `,
      filename: workflowFile('worker-like.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});

ruleTester.run('createClientRule - import detection', testClientRule, {
  valid: [
    // Non-client file (no Temporal imports) - should not report
    {
      code: `const forbidden = 'value';`,
      filename: '/project/src/utils/helpers.ts',
    },
    // Activity file (by imports) - should not report
    {
      code: `
        import { Context } from '@temporalio/activity';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
    },
    // Test file with only testing imports should not report for client rules
    {
      code: `
        import { TestWorkflowEnvironment } from '@temporalio/testing';
        const forbidden = 'value';
      `,
      filename: '/project/src/client.test.ts',
    },
  ],
  invalid: [
    // Client file (by imports) - should report
    {
      code: `
        import { Client } from '@temporalio/client';
        const forbidden = 'value';
      `,
      filename: '/project/src/some-file.ts',
      errors: [{ messageId: 'forbidden' }],
    },
    // Client file (by file path) - should report
    {
      code: `const forbidden = 'value';`,
      filename: clientFile('main.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
    // Imports take priority over file path (workflow path but client import)
    {
      code: `
        import { Client } from '@temporalio/client';
        const forbidden = 'value';
      `,
      filename: workflowFile('client-like.ts'),
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});
