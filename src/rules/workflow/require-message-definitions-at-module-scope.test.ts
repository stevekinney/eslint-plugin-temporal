import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireMessageDefinitionsAtModuleScope } from './require-message-definitions-at-module-scope.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-message-definitions-at-module-scope', () => {
  ruleTester.run(
    'require-message-definitions-at-module-scope',
    requireMessageDefinitionsAtModuleScope,
    {
      valid: [
        `const mySignal = defineSignal('mySignal');`,
        `export const myQuery = defineQuery('myQuery');`,
        `const defs = { update: defineUpdate('myUpdate') };`,
      ],
      invalid: [
        {
          code: `export async function myWorkflow() {
                   const sig = defineSignal('sig');
                   setHandler(sig, () => {});
                 }`,
          errors: [{ messageId: 'moduleScopeDefinitions' }],
        },
        {
          code: `function helper() {
                   return defineQuery('getState');
                 }`,
          errors: [{ messageId: 'moduleScopeDefinitions' }],
        },
        {
          code: `export async function myWorkflow() {
                   setHandler(defineUpdate('doWork'), () => {});
                 }`,
          errors: [{ messageId: 'moduleScopeDefinitions' }],
        },
      ],
    },
  );
});
