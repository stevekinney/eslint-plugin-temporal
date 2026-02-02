import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { conditionTimeoutStyle } from './condition-timeout-style.ts';

const ruleTester = createWorkflowRuleTester();

describe('condition-timeout-style', () => {
  ruleTester.run('condition-timeout-style', conditionTimeoutStyle, {
    valid: [
      `import { condition } from '@temporalio/workflow';
       await condition(() => ready, '30s');`,
      `import * as workflow from '@temporalio/workflow';
       await workflow.condition(() => ready, 1000);`,
      {
        code: `import { condition } from '@temporalio/workflow';
        await condition(() => ready);`,
        options: [{ mode: 'disallow' }],
      },
      {
        code: `import { condition as waitFor } from '@temporalio/workflow';
        await waitFor(() => ready);`,
        options: [{ mode: 'disallow' }],
      },
    ],
    invalid: [
      {
        code: `import { condition } from '@temporalio/workflow';
        await condition(() => ready);`,
        errors: [{ messageId: 'requireTimeout' }],
      },
      {
        code: `import { condition } from '@temporalio/workflow';
        await condition(() => ready, '5s');`,
        options: [{ mode: 'disallow' }],
        errors: [{ messageId: 'disallowTimeout' }],
      },
    ],
  });
});
