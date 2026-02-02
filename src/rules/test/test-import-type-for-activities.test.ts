import { describe } from 'bun:test';

import { createTestRuleTester, testFile } from '../../test-utilities/rule-tester.ts';
import { testImportTypeForActivities } from './test-import-type-for-activities.ts';

const ruleTester = createTestRuleTester();

describe('test-import-type-for-activities', () => {
  ruleTester.run('test-import-type-for-activities', testImportTypeForActivities, {
    valid: [
      `import type * as activities from '../activities';
       const mocks: typeof activities = {};`,
      `import type { sendEmail } from '../activities/email';`,
      `import { helper } from '../utils';`,
    ],
    invalid: [
      {
        code: `import * as activities from '../activities';`,
        filename: testFile(),
        output: `import type * as activities from '../activities';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },
      {
        code: `import { sendEmail } from '../activities/email';`,
        filename: testFile(),
        output: `import type { sendEmail } from '../activities/email';`,
        errors: [{ messageId: 'requireTypeOnlyImport' }],
      },
    ],
  });
});
