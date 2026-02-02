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
    ],
  });
});
