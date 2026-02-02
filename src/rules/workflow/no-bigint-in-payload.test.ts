import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noBigintInPayload } from './no-bigint-in-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-bigint-in-payload', () => {
  ruleTester.run('no-bigint-in-payload', noBigintInPayload, {
    valid: [
      `export async function myWorkflow(input: number): Promise<void> {}`,
      `const sig = defineSignal<[string]>('sig');`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(input: bigint): Promise<void> {}`,
        errors: [{ messageId: 'bigintPayload' }],
      },
      {
        code: `export async function myWorkflow(): Promise<bigint> { return 1n; }`,
        errors: [{ messageId: 'bigintPayload' }],
      },
      {
        code: `const sig = defineSignal<[bigint]>('sig');`,
        errors: [{ messageId: 'bigintPayload' }],
      },
    ],
  });
});
