import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireDeprecatePatchAfterBranchRemoval } from './require-deprecate-patch-after-branch-removal.ts';

const ruleTester = createWorkflowRuleTester();

describe('require-deprecate-patch-after-branch-removal', () => {
  ruleTester.run(
    'require-deprecate-patch-after-branch-removal',
    requireDeprecatePatchAfterBranchRemoval,
    {
      valid: [
        `if (patched('feature')) { newBehavior(); } else { oldBehavior(); }`,
        `if (!patched('feature')) { oldBehavior(); } newBehavior();`,
        `if (patched('feature')) { newBehavior(); }
deprecatePatch('feature');`,
        `patched('feature');
deprecatePatch('feature');`,
        `if (patched('feature')) { newBehavior(); } else { oldBehavior(); }
deprecatePatch('other');`,
      ],
      invalid: [
        {
          code: `if (patched('feature')) { newBehavior(); }`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
        {
          code: `patched('feature');
newBehavior();`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
        {
          code: `if (patched('feature')) { newBehavior(); }
deprecatePatch('other');`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
      ],
    },
  );
});
