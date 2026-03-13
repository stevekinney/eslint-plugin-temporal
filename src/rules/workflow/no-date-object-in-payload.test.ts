import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDateObjectInPayload } from './no-date-object-in-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-date-object-in-payload', () => {
  ruleTester.run('no-date-object-in-payload', noDateObjectInPayload, {
    valid: [
      `export async function myWorkflow(input: string): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,

      // allowDate option set to true
      {
        code: `export async function myWorkflow(input: Date): Promise<void> {}`,
        options: [{ allowDate: true }],
      },

      // Non-async exported functions are not checked
      `export function helper(input: Date): Date { return input; }`,
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

      // Union type containing Date
      {
        code: `export async function myWorkflow(input: string | Date): Promise<void> {}`,
        errors: [{ messageId: 'datePayload' }],
      },

      // Date in return union type
      {
        code: `export async function myWorkflow(): Promise<Date | null> { return null; }`,
        errors: [{ messageId: 'datePayload' }],
      },

      // defineQuery with Date return type
      {
        code: `const q = defineQuery<Date, [string]>('q');`,
        errors: [{ messageId: 'datePayload' }],
      },

      // defineQuery with Date argument type
      {
        code: `const q = defineQuery<string, [Date]>('q');`,
        errors: [{ messageId: 'datePayload' }],
      },

      // defineUpdate with Date types
      {
        code: `const u = defineUpdate<Date, [Date]>('u');`,
        errors: [{ messageId: 'datePayload' }, { messageId: 'datePayload' }],
      },

      // setHandler with inline callback containing Date param
      {
        code: `const sig = defineSignal('sig');
setHandler(sig, (value: Date) => {});`,
        errors: [{ messageId: 'datePayload' }],
      },
    ],
  });
});
