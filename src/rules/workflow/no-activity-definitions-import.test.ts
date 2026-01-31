import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noActivityDefinitionsImport } from './no-activity-definitions-import.ts';

const ruleTester = createBasicRuleTester();

describe('no-activity-definitions-import', () => {
  ruleTester.run('no-activity-definitions-import', noActivityDefinitionsImport, {
    valid: [
      // Type-only imports are allowed
      `import type { MyActivity } from '../activities';`,
      `import type * as activities from '../activities';`,
      `import { type MyActivity } from '../activities';`,
      `import type { greet, farewell } from './activities/greetings';`,

      // Non-activity imports are allowed
      `import { something } from '../utils';`,
      `import { helper } from './helpers';`,
      `import { config } from '../config';`,

      // Package imports are allowed
      `import { proxyActivities } from '@temporalio/workflow';`,
      `import axios from 'axios';`,

      // Type import with value import from non-activity source
      `import { type Foo, bar } from '../utils';`,
    ],
    invalid: [
      {
        code: `import { myActivity } from '../activities';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import * as activities from '../activities';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import activities from '../activities';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import { greet, farewell } from './activities/greetings';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import { sendEmail } from '../activity/email';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import { processOrder } from './order.activities';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      {
        code: `import { doWork } from './work.activity';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
      // Mixed imports where at least one is a value import
      {
        code: `import { type MyType, myActivity } from '../activities';`,
        errors: [{ messageId: 'noActivityDefinitionsImport' }],
      },
    ],
  });
});
