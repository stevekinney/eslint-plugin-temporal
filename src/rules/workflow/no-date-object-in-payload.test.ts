import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDateObjectInPayload } from './no-date-object-in-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-date-object-in-payload', () => {
  ruleTester.run('no-date-object-in-payload', noDateObjectInPayload, {
    valid: [
      `export async function myWorkflow(input: string): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(input: Date): Promise<void> {}`,
        errors: [{ messageId: 'datePayload' }],
      },
      {
        code: `export async function myWorkflow(): Promise<Date> { return new Date(); }`,
        errors: [{ messageId: 'datePayload' }],
      },
      {
        code: `const query = defineQuery<Date, []>('q');`,
        errors: [{ messageId: 'datePayload' }],
      },
    ],
  });
});
