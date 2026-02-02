import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireTypeOnlyActivityImports } from './require-type-only-activity-imports.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-type-only-activity-imports', () => {
  ruleTester.run('require-type-only-activity-imports', requireTypeOnlyActivityImports, {
    valid: [
      // Type-only import from activities
      `import type { Activities } from './activities';`,

      // Type-only import with path
      `import type { sendEmail } from '../activities/email';`,

      // Individual type specifiers
      `import { type Activities } from './activities';`,

      // Non-activity relative imports are fine
      `import { helper } from './utils';`,

      // External packages are fine
      `import { proxyActivities } from '@temporalio/workflow';`,

      // Type-only namespace import
      `import type * as activities from './activities';`,
    ],
    invalid: [
      // Value import from activities
      {
        code: `import { Activities } from './activities';`,
        output: `import type { Activities } from './activities';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },

      // Value import with path
      {
        code: `import { sendEmail } from '../activities/email';`,
        output: `import type { sendEmail } from '../activities/email';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },

      // Namespace import
      {
        code: `import * as activities from './activities';`,
        output: `import type * as activities from './activities';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },

      // Default import
      {
        code: `import activities from './activities';`,
        output: `import type activities from './activities';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },

      // activity singular directory
      {
        code: `import { process } from './activity/processor';`,
        output: `import type { process } from './activity/processor';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },

      // .activities suffix
      {
        code: `import { handler } from './email.activities';`,
        output: `import type { handler } from './email.activities';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },
    ],
  });
});
