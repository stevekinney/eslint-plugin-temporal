import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noMixedScopeExports } from './no-mixed-scope-exports.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-mixed-scope-exports', () => {
  ruleTester.run('no-mixed-scope-exports', noMixedScopeExports, {
    valid: [
      `import { defineSignal } from '@temporalio/workflow';
       export const mySignal = defineSignal('mySignal');
       export async function myWorkflow() {}`,
      `export const helper = 123;`,
      // Member expression callee — isForbiddenCallee returns false
      `import { Client } from '@temporalio/client';
       export const result = Client.create();`,
      `import type { Client } from '@temporalio/client';
       export type { Client };`,
    ],
    invalid: [
      {
        code: `export { Worker } from '@temporalio/worker';`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      {
        code: `import { Client } from '@temporalio/client';
export { Client };`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      {
        code: `import { Worker } from '@temporalio/worker';
export default Worker;`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      {
        code: `import { Client } from '@temporalio/client';
export const client = new Client();`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      // export default with a forbidden identifier (non-direct import)
      {
        code: `import { Client } from '@temporalio/client';
const myClient = Client;
export default Client;`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      // export default with a forbidden call expression
      {
        code: `import { Client } from '@temporalio/client';
export default Client();`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      // Re-export from @temporalio/activity
      {
        code: `export { someActivity } from '@temporalio/activity';`,
        errors: [{ messageId: 'mixedScopeExport' }],
      },
      // Type-only re-export should be valid (not flagged)
      // This is already tested in the valid section
    ],
  });
});
