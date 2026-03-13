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
        // Handler parameter with no type annotation should pass (nothing to check)
        `const sig = defineSignal<[string]>('sig');
         setHandler(sig, (input) => {
           doWork(input);
         });`,
        // Signal handler ignores return type
        `const sig = defineSignal<[string]>('sig');
         setHandler(sig, (input: string): void => {
           doWork(input);
         });`,
        // allowTypes option removes a default-disallowed type (line 100)
        {
          code: `const sig = defineSignal<[Date]>('sig');`,
          options: [{ allowTypes: ['Date'] }],
        },
        // MemberExpression callee in VariableDeclarator — callee is not Identifier (line 256)
        `const query = wf.defineQuery<string>('q');`,
        // Handler with rest parameter typed on the argument (lines 218-221)
        `const sig = defineSignal<[string]>('sig');
         setHandler(sig, (...args: string[]) => {
           doWork(args);
         });`,
        // Handler with default parameter (line 225)
        `const sig = defineSignal<[string]>('sig');
         setHandler(sig, (input: string = 'default') => {
           doWork(input);
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
        // Union type containing a disallowed type
        {
          code: `const sig = defineSignal<[string | Date]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // Intersection type containing a disallowed type
        {
          code: `const query = defineQuery<{ id: string } & Map<string, number>, [string]>('q');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // Tuple type containing a disallowed type
        {
          code: `const sig = defineSignal<[[string, Set<number>]]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // bigint keyword type
        {
          code: `const sig = defineSignal<[bigint]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // symbol keyword type
        {
          code: `const sig = defineSignal<[symbol]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // TSQualifiedName — e.g. Namespace.Date (lines 44-47)
        {
          code: `const sig = defineSignal<[NS.Date]>('sig');`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // Rest parameter with disallowed type on argument (lines 218-221)
        {
          code: `const sig = defineSignal<[string]>('sig');
                 setHandler(sig, (...args: Date[]) => {
                   doWork(args);
                 });`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
        // Default parameter with disallowed type (line 225)
        {
          code: `const sig = defineSignal<[string]>('sig');
                 setHandler(sig, (input: Date = new Date()) => {
                   doWork(input);
                 });`,
          errors: [{ messageId: 'unsafeHandlerType' }],
        },
      ],
    },
  );
});
