import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noTemporalInternalImports } from './no-temporal-internal-imports.ts';

const ruleTester = createBasicRuleTester();

describe('no-temporal-internal-imports', () => {
  ruleTester.run('no-temporal-internal-imports', noTemporalInternalImports, {
    valid: [
      // Public API imports
      `import { proxyActivities } from '@temporalio/workflow';`,
      `import { Context } from '@temporalio/activity';`,
      `import { Worker } from '@temporalio/worker';`,
      `import { Client } from '@temporalio/client';`,
      `import { ApplicationFailure } from '@temporalio/common';`,

      // Type imports from public API
      `import type { ActivityInterface } from '@temporalio/activity';`,

      // Other packages
      `import { something } from 'some-package/lib/internal';`,
      `import { helper } from './lib/helpers';`,
    ],
    invalid: [
      // Internal workflow imports
      {
        code: `import { something } from '@temporalio/workflow/lib/internal';`,
        errors: [
          {
            messageId: 'noInternalImport',
            data: {
              path: '@temporalio/workflow/lib/internal',
              publicPath: '@temporalio/workflow',
            },
          },
        ],
      },

      // Internal activity imports
      {
        code: `import { internalFn } from '@temporalio/activity/lib/utils';`,
        errors: [
          {
            messageId: 'noInternalImport',
            data: {
              path: '@temporalio/activity/lib/utils',
              publicPath: '@temporalio/activity',
            },
          },
        ],
      },

      // Internal worker imports
      {
        code: `import { WorkerInternal } from '@temporalio/worker/src/worker';`,
        errors: [
          {
            messageId: 'noInternalImport',
            data: {
              path: '@temporalio/worker/src/worker',
              publicPath: '@temporalio/worker',
            },
          },
        ],
      },

      // Internal client imports
      {
        code: `import { ClientImpl } from '@temporalio/client/lib/client-impl';`,
        errors: [
          {
            messageId: 'noInternalImport',
            data: {
              path: '@temporalio/client/lib/client-impl',
              publicPath: '@temporalio/client',
            },
          },
        ],
      },

      // Deep internal path
      {
        code: `import { x } from '@temporalio/common/lib/internal/encoding';`,
        errors: [{ messageId: 'noInternalImport' }],
      },
    ],
  });
});
