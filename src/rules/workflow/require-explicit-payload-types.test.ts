import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireExplicitPayloadTypes } from './require-explicit-payload-types.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-explicit-payload-types', () => {
  ruleTester.run('require-explicit-payload-types', requireExplicitPayloadTypes, {
    valid: [
      `export async function myWorkflow(input: { id: string }): Promise<void> {}`,
      `export const myWorkflow = async (input: { id: string }): Promise<void> => {};`,
      `const myWorkflow = async (input: { id: string }): Promise<void> => {};
       export { myWorkflow };`,
      `const sig = defineSignal<[string]>('sig');
       const query = defineQuery<string, [string]>('q');
       const update = defineUpdate<string, [string]>('u');`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(input) { return 1; }`,
        errors: [{ messageId: 'missingReturnType' }, { messageId: 'missingParamType' }],
      },
      {
        code: `export const myWorkflow = async (input: { id: string }) => {};`,
        errors: [{ messageId: 'missingReturnType' }],
      },
      {
        code: `const sig = defineSignal('sig');`,
        errors: [{ messageId: 'missingMessageTypes' }],
      },
      {
        code: `const query = defineQuery<string>('q');`,
        errors: [{ messageId: 'missingMessageTypes' }],
      },
    ],
  });
});
