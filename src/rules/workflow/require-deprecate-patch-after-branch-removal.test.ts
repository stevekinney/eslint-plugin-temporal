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
        `if (wf.patched('feature')) { newBehavior(); }
wf.deprecatePatch('feature');`,
        // Non-patched call should be ignored
        `someOtherFunction('feature');`,
        // Member expression with non-patched property should be ignored
        `wf.someOtherMethod('feature');`,
        // patched() with no arguments — patchId is null, so no tracking
        `patched();`,
        // Template literal patch ID (no expressions)
        `if (patched(\`feature\`)) { newBehavior(); }
deprecatePatch(\`feature\`);`,
        // deprecatePatch via member expression with template literal
        `if (wf.patched(\`feature-tpl\`)) { newBehavior(); }
wf.deprecatePatch(\`feature-tpl\`);`,
        // Template literal with expression — getPatchId returns null, so not tracked
        `if (patched(\`feature-\${version}\`)) { newBehavior(); }`,
        // patched() with non-string argument (number) — getPatchId returns null
        `if (patched(42)) { newBehavior(); }`,
        // deprecatePatch with no arguments — patchId is null, so not tracked
        `deprecatePatch();`,
        // IIFE — callee is ArrowFunctionExpression, triggers return false in isPatchedCall/isDeprecatePatchCall
        `(() => {})();`,
        // CallExpression callee (chained call) — isPatchedCall returns false
        `getFunction()('feature');`,
        // Computed member expression — isPatchedCall and isDeprecatePatchCall return false
        `obj['patched']('feature');
obj['deprecatePatch']('feature');`,
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
        {
          code: `if (wf.patched('feature')) { newBehavior(); }`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
        // Template literal patch ID without deprecatePatch
        {
          code: `if (patched(\`feature\`)) { newBehavior(); }`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
        // wf.patched as expression statement (no guard)
        {
          code: `wf.patched('feature');
newBehavior();`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
        // Duplicate patch IDs — only reported once (tests the `reported` set)
        {
          code: `patched('feature');
patched('feature');`,
          errors: [{ messageId: 'deprecatePatchRequired', data: { patchId: 'feature' } }],
        },
      ],
    },
  );
});
