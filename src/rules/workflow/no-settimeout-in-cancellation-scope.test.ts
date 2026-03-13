import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noSetTimeoutInCancellationScope } from './no-settimeout-in-cancellation-scope.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-settimeout-in-cancellation-scope', () => {
  ruleTester.run('no-settimeout-in-cancellation-scope', noSetTimeoutInCancellationScope, {
    valid: [
      `setTimeout(() => {}, 1000);`,
      `await CancellationScope.withTimeout('1m', async () => {
           await sleep('1s');
         });`,
      // Plain function call (callee is Identifier, not MemberExpression — lines 20-21)
      {
        code: `await withTimeout(async () => {
                 setTimeout(() => {}, 1000);
               });`,
      },
      // Member expression with unrelated method name (line 25)
      {
        code: `await CancellationScope.someOtherMethod(async () => {
                 setTimeout(() => {}, 1000);
               });`,
      },
      // Call expression object — can't determine it's CancellationScope (line 39)
      {
        code: `await getCancellationScope().nonCancellable(async () => {
                 setTimeout(() => {}, 1000);
               });`,
      },
      // Computed property on CancellationScope — property.type !== Identifier (lines 20-21)
      {
        code: `await CancellationScope['withTimeout']('1m', async () => {
                 setTimeout(() => {}, 1000);
               });`,
      },
    ],
    invalid: [
      {
        code: `await CancellationScope.withTimeout('1m', async () => {
                   setTimeout(() => {}, 1000);
                 });`,
        errors: [{ messageId: 'noSetTimeoutInCancellationScope' }],
      },
      {
        code: `const timers = { setTimeout };
                 await CancellationScope.nonCancellable(async () => {
                   timers.setTimeout(() => {}, 1000);
                 });`,
        errors: [{ messageId: 'noSetTimeoutInCancellationScope' }],
      },
      {
        code: `await wf.CancellationScope.withTimeout('1m', async () => {
                   setTimeout(() => {}, 1000);
                 });`,
        errors: [{ messageId: 'noSetTimeoutInCancellationScope' }],
      },
    ],
  });
});
