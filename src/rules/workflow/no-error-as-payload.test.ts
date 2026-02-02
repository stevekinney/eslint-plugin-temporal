import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noErrorAsPayload } from './no-error-as-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-error-as-payload', () => {
  ruleTester.run('no-error-as-payload', noErrorAsPayload, {
    valid: [
      `export async function myWorkflow(input: { message: string }): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(input: Error): Promise<void> {}`,
        errors: [{ messageId: 'errorPayload' }],
      },
      {
        code: `export async function myWorkflow(): Promise<MyError> { throw new Error('x'); }`,
        errors: [{ messageId: 'errorPayload' }],
      },
      {
        code: `const sig = defineSignal<Error>('sig');`,
        errors: [{ messageId: 'errorPayload' }],
      },
    ],
  });
});
