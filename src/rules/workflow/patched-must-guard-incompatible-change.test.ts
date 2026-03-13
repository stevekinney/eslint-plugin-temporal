import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { patchedMustGuardIncompatibleChange } from './patched-must-guard-incompatible-change.ts';

const ruleTester = createWorkflowRuleTester();

describe('patched-must-guard-incompatible-change', () => {
  ruleTester.run(
    'patched-must-guard-incompatible-change',
    patchedMustGuardIncompatibleChange,
    {
      valid: [
        `if (patched('feature-v2')) { newBehavior(); } else { oldBehavior(); }`,
        `if (!patched('feature-v2')) { oldBehavior(); } newBehavior();`,
        `return patched('feature-v2') ? newBehavior() : oldBehavior();`,
        `if (patched('feature-v2') && ready) { newBehavior(); }`,
        `if (wf.patched('feature-v2')) { newBehavior(); } else { oldBehavior(); }`,
        // patched() in a while loop test
        `while (patched('feature-v2')) { newBehavior(); break; }`,
        // patched() in a do...while test
        `do { newBehavior(); } while (patched('feature-v2'));`,
        // patched() in a for loop test
        `for (let i = 0; patched('feature-v2'); i++) { doWork(); break; }`,
        // patched() in a switch case test expression
        `switch (true) { case patched('feature-v2'): newBehavior(); break; }`,
        // Non-patched function call should be ignored entirely
        `someOtherFunction('feature-v2');`,
        // Member expression with non-patched property should be ignored
        `wf.someOtherMethod('feature-v2');`,
        // IIFE — callee is an ArrowFunctionExpression, not Identifier or MemberExpression
        // isPatchedCall returns false (hits return false path)
        `(() => {})();`,
        // Computed member expression property — isPatchedCall returns false (property not Identifier)
        `if (wf['patched']('feature-v2')) { newBehavior(); }`,
      ],
      invalid: [
        {
          code: `patched('feature-v2');
newBehavior();`,
          errors: [{ messageId: 'patchedMustGuard' }],
        },
        {
          code: `const useNew = patched('feature-v2');
if (useNew) { newBehavior(); }`,
          errors: [{ messageId: 'patchedMustGuard' }],
        },
        {
          code: `log(patched('feature-v2'));`,
          errors: [{ messageId: 'patchedMustGuard' }],
        },
        {
          code: `wf.patched('feature-v2');
newBehavior();`,
          errors: [{ messageId: 'patchedMustGuard' }],
        },
        // patched() inside if body (not in test) — isTestNode returns false, break is hit
        {
          code: `if (condition) { patched('feature-v2'); }`,
          errors: [{ messageId: 'patchedMustGuard' }],
        },
      ],
    },
  );
});
