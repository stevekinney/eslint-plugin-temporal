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
      ],
    },
  );
});
