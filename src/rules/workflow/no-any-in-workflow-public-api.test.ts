import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noAnyInWorkflowPublicApi } from './no-any-in-workflow-public-api.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-any-in-workflow-public-api', () => {
  ruleTester.run('no-any-in-workflow-public-api', noAnyInWorkflowPublicApi, {
    valid: [
      `export async function myWorkflow(input: { id: string }): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(input: any): Promise<void> {}`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
      {
        code: `export async function myWorkflow(): Promise<any> { return {}; }`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
      {
        code: `const sig = defineSignal<any>('sig');`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
      {
        code: `const query = defineQuery<string, [any]>('q');`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
    ],
  });
});
