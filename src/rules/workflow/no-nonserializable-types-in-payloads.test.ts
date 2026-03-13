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
        // Function type in payload argument
        {
          code: `export async function myWorkflow(callback: () => void): Promise<void> {}`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        // Symbol type in payload argument
        {
          code: `export async function myWorkflow(id: symbol): Promise<void> {}`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        // WeakMap in return type
        {
          code: `export async function myWorkflow(): Promise<WeakMap<object, string>> { return new WeakMap(); }`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        // WeakSet in signal definition
        {
          code: `const sig = defineSignal<[WeakSet<object>]>('sig');`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
        // Constructor type in handler callback
        {
          code: `const update = defineUpdate<string, [string]>('update');
                 setHandler(update, (input: string): new () => object => { return Object; });`,
          errors: [{ messageId: 'nonSerializableType' }],
        },
      ],
    },
  );
});
