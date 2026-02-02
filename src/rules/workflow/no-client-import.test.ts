import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noClientImport } from './no-client-import.ts';

const ruleTester = createBasicRuleTester();

describe('no-client-import', () => {
  ruleTester.run('no-client-import', noClientImport, {
    valid: [
      // @temporalio/workflow is allowed
      `import { proxyActivities, startChild } from '@temporalio/workflow';`,

      // @temporalio/common is allowed
      `import { ApplicationFailure } from '@temporalio/common';`,

      // Type imports from other places
      `import type { WorkflowClient } from '@temporalio/client';`,

      // Other packages
      `import { Client } from 'some-other-client';`,
    ],
    invalid: [
      // Basic import
      {
        code: `import { Client } from '@temporalio/client';`,
        errors: [{ messageId: 'noClientImport' }],
      },

      // Named imports
      {
        code: `import { WorkflowClient, Connection } from '@temporalio/client';`,
        errors: [{ messageId: 'noClientImport' }],
      },

      // Default import
      {
        code: `import Client from '@temporalio/client';`,
        errors: [{ messageId: 'noClientImport' }],
      },

      // Namespace import
      {
        code: `import * as client from '@temporalio/client';`,
        errors: [{ messageId: 'noClientImport' }],
      },

      // Side effect import
      {
        code: `import '@temporalio/client';`,
        errors: [{ messageId: 'noClientImport' }],
      },
    ],
  });
});
