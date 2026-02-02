import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { durationFormat } from './duration-format.ts';

const ruleTester = createWorkflowRuleTester();

describe('duration-format', () => {
  ruleTester.run('duration-format', durationFormat, {
    valid: [
      `import { sleep, condition, CancellationScope } from '@temporalio/workflow';
       await sleep('5s');
       await condition(() => ready, '30s');
       await CancellationScope.withTimeout('1m', async () => {});`,
      `import * as workflow from '@temporalio/workflow';
       await workflow.sleep('1 minute');
       await workflow.condition(() => ready, '10s');
       await workflow.CancellationScope.withTimeout('5s', async () => {});`,
      {
        code: `import { sleep, condition, CancellationScope } from '@temporalio/workflow';
        await sleep(5000);
        await condition(() => ready, 1000);
        await CancellationScope.withTimeout(2500, async () => {});`,
        options: [{ format: 'number' }],
      },
      {
        code: `import { sleep } from '@temporalio/workflow';
        const timeout = 5000;
        await sleep(timeout);`,
      },
    ],
    invalid: [
      {
        code: `import { sleep } from '@temporalio/workflow';
        await sleep(5000);`,
        errors: [{ messageId: 'durationFormat' }],
      },
      {
        code: `import { condition } from '@temporalio/workflow';
        await condition(() => ready, 1000);`,
        errors: [{ messageId: 'durationFormat' }],
      },
      {
        code: `import * as workflow from '@temporalio/workflow';
        await workflow.CancellationScope.withTimeout(5000, async () => {});`,
        errors: [{ messageId: 'durationFormat' }],
      },
      {
        code: `import { sleep } from '@temporalio/workflow';
        await sleep('5s');`,
        options: [{ format: 'number' }],
        errors: [{ messageId: 'durationFormat' }],
      },
    ],
  });
});
