import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireHandlerSerializationSafeTypes } from './require-handler-serialization-safe-types.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-handler-serialization-safe-types', () => {
  ruleTester.run(
    'require-handler-serialization-safe-types',
    requireHandlerSerializationSafeTypes,
    {
      valid: [
        `const sig = defineSignal<[string, { id: string }]>('sig');`,
        `const getState = defineQuery<{ count: number }, [string]>('getState');`,
        `const update = defineUpdate<{ ok: boolean }, [string]>('update');`,
        `const sig = defineSignal<[string]>('sig');
         setHandler(sig, (input: string) => {
           doWork(input);
         });`,
        `const update = defineUpdate<{ ok: boolean }, [string]>('update');
         setHandler(update, async (input: { id: string }): Promise<{ ok: boolean }> => {
           return { ok: true };
         });`,
      ],
      invalid: [
        {
          code: `const sig = defineSignal<[Date]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        {
          code: `const getInfo = defineQuery<Date>('getInfo');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        {
          code: `const sig = defineSignal<[string]>('sig');
                 setHandler(sig, (cb: () => void) => {
                   cb();
                 });`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        {
          code: `const update = defineUpdate<number, [string]>('update');
                 setHandler(update, (input: string): Map<string, string> => {
                   return new Map();
                 });`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
      ],
    },
  );
});
