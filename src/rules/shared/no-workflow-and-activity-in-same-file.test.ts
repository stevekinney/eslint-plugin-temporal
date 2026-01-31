import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWorkflowAndActivityInSameFile } from './no-workflow-and-activity-in-same-file.ts';

const ruleTester = createBasicRuleTester();

describe('no-workflow-and-activity-in-same-file', () => {
  ruleTester.run(
    'no-workflow-and-activity-in-same-file',
    noWorkflowAndActivityInSameFile,
    {
      valid: [
        // Only workflow imports
        `import { proxyActivities, sleep } from '@temporalio/workflow';`,

        // Only activity imports
        `import { Context } from '@temporalio/activity';`,

        // Only common imports
        `import { ApplicationFailure } from '@temporalio/common';`,

        // Type-only imports are allowed together
        `
        import type { WorkflowInfo } from '@temporalio/workflow';
        import type { Context } from '@temporalio/activity';
        `,

        // Type-only workflow import with value activity import is allowed
        `
        import type { WorkflowInfo } from '@temporalio/workflow';
        import { Context } from '@temporalio/activity';
        `,

        // Type-only activity import with value workflow import is allowed
        `
        import { proxyActivities } from '@temporalio/workflow';
        import type { Context } from '@temporalio/activity';
        `,

        // Multiple workflow imports
        `
        import { proxyActivities } from '@temporalio/workflow';
        import { sleep } from '@temporalio/workflow';
        `,

        // Client and worker together (different use case)
        `
        import { Client } from '@temporalio/client';
        import { Worker } from '@temporalio/worker';
        `,
      ],
      invalid: [
        // Both workflow and activity imports
        {
          code: `
            import { proxyActivities } from '@temporalio/workflow';
            import { Context } from '@temporalio/activity';
          `,
          errors: [
            { messageId: 'noMixedEnvironments' },
            { messageId: 'noMixedEnvironments' },
          ],
        },

        // With additional common imports
        {
          code: `
            import { proxyActivities } from '@temporalio/workflow';
            import { ApplicationFailure } from '@temporalio/common';
            import { Context } from '@temporalio/activity';
          `,
          errors: [
            { messageId: 'noMixedEnvironments' },
            { messageId: 'noMixedEnvironments' },
          ],
        },

        // Namespace imports
        {
          code: `
            import * as workflow from '@temporalio/workflow';
            import * as activity from '@temporalio/activity';
          `,
          errors: [
            { messageId: 'noMixedEnvironments' },
            { messageId: 'noMixedEnvironments' },
          ],
        },

        // Side-effect imports
        {
          code: `
            import '@temporalio/workflow';
            import '@temporalio/activity';
          `,
          errors: [
            { messageId: 'noMixedEnvironments' },
            { messageId: 'noMixedEnvironments' },
          ],
        },
      ],
    },
  );
});
