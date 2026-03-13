import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noErrorAsPayload } from './no-error-as-payload.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-error-as-payload', () => {
  ruleTester.run('no-error-as-payload', noErrorAsPayload, {
    valid: [
      `export async function myWorkflow(input: { message: string }): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,

      // export default function with non-error params
      `export default async function(input: string): Promise<void> {}`,

      // export default via identifier with non-error types
      `const fn = async (input: string): Promise<void> => {};
       export default fn;`,

      // MemberExpression callee in VariableDeclarator (call.callee.type !== Identifier, line 165)
      `const query = wf.defineQuery<string>('q');`,

      // allowTypes option whitelists an error-like type (exercises allowTypes callback)
      {
        code: `export async function myWorkflow(input: AppError): Promise<void> {}`,
        options: [{ allowTypes: ['AppError'] }],
      },

      // defineQuery with no type arguments (no error type to report)
      `const query = defineQuery('q');`,

      // defineUpdate type arguments with non-error types
      `const upd = defineUpdate<string, [number]>('upd');`,
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

      // setHandler with Error type in callback params
      {
        code: `export async function myWorkflow() {
                 const sig = defineSignal('sig');
                 setHandler(sig, (err: Error) => {
                   console.log(err);
                 });
               }`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // Handler with Error in return type annotation
      {
        code: `export async function myWorkflow() {
                 const query = defineQuery('query');
                 setHandler(query, (): TypeError => {
                   return new TypeError('test');
                 });
               }`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // export default function with Error parameter (exercises findExportedFunctions line 96-101)
      {
        code: `export default async function(input: Error): Promise<void> {}`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // export default via identifier reference (exercises findExportedFunctions line 103-108)
      {
        code: `const fn = async (input: Error): Promise<void> => {};
               export default fn;`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // export default function with Error return type
      {
        code: `export default async function myWorkflow(): Promise<TypeError> { throw new Error('x'); }`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // defineUpdate with Error as return type (first type arg)
      {
        code: `const upd = defineUpdate<TypeError, [string]>('upd');`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // defineUpdate with Error as argument type (second type arg)
      {
        code: `const upd = defineUpdate<string, [RangeError]>('upd');`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // defineQuery with Error as return type
      {
        code: `const query = defineQuery<Error>('q');`,
        errors: [{ messageId: 'errorPayload' }],
      },

      // Inline defineQuery call expression (not via VariableDeclarator)
      {
        code: `export async function myWorkflow() {
                 setHandler(defineQuery<Error>('q'), () => {
                   return new Error('test');
                 });
               }`,
        errors: [{ messageId: 'errorPayload' }],
      },
    ],
  });
});
