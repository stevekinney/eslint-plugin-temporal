import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noAnyInWorkflowPublicApi } from './no-any-in-workflow-public-api.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-any-in-workflow-public-api', () => {
  ruleTester.run('no-any-in-workflow-public-api', noAnyInWorkflowPublicApi, {
    valid: [
      `export async function myWorkflow(input: { id: string }): Promise<void> {}`,
      `const query = defineQuery<string, [string]>('q');`,
      // VariableDeclarator with a member expression callee — callee is not Identifier, skipped
      `const query = wf.defineQuery('q');`,
      // setHandler with unknown handler type — skipped
      `setHandler(unknownDef, (data) => { return data; });`,
      // setHandler with callback passed as identifier reference — skipped
      `const myQuery = defineQuery('q');
       setHandler(myQuery, myQueryHandler);`,
      // setHandler with no callback argument — skipped
      `const myQuery = defineQuery('q');
       setHandler(myQuery);`,
      // setHandler with properly typed query handler
      `const myQuery = defineQuery('q');
       setHandler(myQuery, (input: string): string => { return input; });`,
      // VariableDeclarator with non-CallExpression init — early return
      `const x = 42;`,
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
      // setHandler with any in query handler callback return type
      {
        code: `const myQuery = defineQuery('q');
               setHandler(myQuery, (input: string): any => { return input; });`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
      // setHandler with any in signal handler callback parameter
      {
        code: `const mySig = defineSignal('s');
               setHandler(mySig, (data: any) => { console.log(data); });`,
        errors: [{ messageId: 'noAnyInPayload' }],
      },
    ],
  });
});
