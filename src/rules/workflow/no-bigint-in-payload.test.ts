import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noBigintInPayload } from './no-bigint-in-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-bigint-in-payload', () => {
  ruleTester.run('no-bigint-in-payload', noBigintInPayload, {
    valid: [
      `export async function myWorkflow(input: number): Promise<void> {}`,
      `const sig = defineSignal<[string]>('sig');`,

      // allowBigInt option set to true
      {
        code: `export async function myWorkflow(input: bigint): Promise<void> {}`,
        options: [{ allowBigInt: true }],
      },

      // Non-async exported functions are not checked
      `export function helper(input: bigint): bigint { return input; }`,
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

      // Union type containing bigint
      {
        code: `export async function myWorkflow(input: string | bigint): Promise<void> {}`,
        errors: [{ messageId: 'bigintPayload' }],
      },

      // BigInt in return type (as type reference)
      {
        code: `export async function myWorkflow(): Promise<BigInt> { return 1n; }`,
        errors: [{ messageId: 'bigintPayload' }],
      },

      // defineQuery with bigint return type
      {
        code: `const q = defineQuery<bigint, [string]>('q');`,
        errors: [{ messageId: 'bigintPayload' }],
      },

      // defineQuery with bigint argument type
      {
        code: `const q = defineQuery<string, [bigint]>('q');`,
        errors: [{ messageId: 'bigintPayload' }],
      },

      // defineUpdate with bigint types
      {
        code: `const u = defineUpdate<bigint, [bigint]>('u');`,
        errors: [{ messageId: 'bigintPayload' }, { messageId: 'bigintPayload' }],
      },

      // setHandler with inline callback containing bigint param
      {
        code: `const sig = defineSignal('sig');
setHandler(sig, (value: bigint) => {});`,
        errors: [{ messageId: 'bigintPayload' }],
      },
    ],
  });
});
