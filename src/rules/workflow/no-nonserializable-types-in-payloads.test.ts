import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noNonserializableTypesInPayloads } from './no-nonserializable-types-in-payloads.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-nonserializable-types-in-payloads', () => {
  ruleTester.run(
    'no-nonserializable-types-in-payloads',
    noNonserializableTypesInPayloads,
    {
      valid: [
        `export async function myWorkflow(input: { id: string; tags: string[] }): Promise<{ ok: boolean }> {
          return { ok: true };
        }`,
        `const sig = defineSignal<[string, number]>('sig');
         setHandler(sig, (name: string, count: number) => {
           return;
         });`,
      ],
      invalid: [
        {
          code: `export async function myWorkflow(input: Map<string, string>): Promise<void> {}`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        {
          code: `export async function myWorkflow(): Promise<Set<string>> { return new Set(); }`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        {
          code: `const query = defineQuery<Map<string, string>, [string]>('q');`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        {
          code: `const query = defineQuery<string, [RegExp]>('q');
                 setHandler(query, (pattern: RegExp) => 'ok');`,
          errors: [
            { messageId: 'nonSerializableType' },
            { messageId: 'nonSerializableType' },
          ],
        },
      ],
    },
  );
});
