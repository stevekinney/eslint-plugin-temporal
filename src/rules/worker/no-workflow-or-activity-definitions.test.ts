import { describe } from 'bun:test';

import { createWorkerRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWorkflowOrActivityDefinitions } from './no-workflow-or-activity-definitions.ts';

const ruleTester = createWorkerRuleTester();

describe('no-workflow-or-activity-definitions', () => {
  ruleTester.run('no-workflow-or-activity-definitions', noWorkflowOrActivityDefinitions, {
    valid: [
      // Type imports are fine
      `import type { MyWorkflow } from '../workflows';`,
      `import { type WorkflowType } from './workflows/index';`,

      // Non-workflow/activity imports
      `import { config } from '../config';`,
      `import { helper } from './utilities';`,

      // Package imports
      `import { Worker } from '@temporalio/worker';`,
      `import { proxyActivities } from '@temporalio/workflow';`,

      // Activity imports for Worker.create are fine
      // (This rule mainly targets workflow imports)
      `import * as activities from '../activities';`,
    ],
    invalid: [
      // Direct workflow import
      {
        code: `import { myWorkflow } from '../workflows';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },
      {
        code: `import * as workflows from './workflows';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },
      {
        code: `import myWorkflow from '../workflow';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },

      // Workflow with suffix
      {
        code: `import { orderWorkflow } from './order.workflow';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },
      {
        code: `import { processOrder } from '../workflows/order';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },

      // Mixed type and value imports
      {
        code: `import { type MyType, myWorkflow } from '../workflows';`,
        errors: [{ messageId: 'noWorkflowDefinitions' }],
      },
    ],
  });
});
