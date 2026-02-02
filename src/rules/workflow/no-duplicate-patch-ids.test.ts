import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDuplicatePatchIds } from './no-duplicate-patch-ids.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-duplicate-patch-ids', () => {
  ruleTester.run('no-duplicate-patch-ids', noDuplicatePatchIds, {
    valid: [
      // Different patch IDs
      `if (patched('feature-v1')) {
         newBehavior();
       }
       if (patched('feature-v2')) {
         newerBehavior();
       }`,

      // patched and deprecatePatch with different IDs
      `deprecatePatch('old-feature');
       if (patched('new-feature')) {
         doSomething();
       }`,

      // Single patch ID usage
      `if (patched('my-feature')) {
         useNewImplementation();
       }`,

      // Template literals with different content
      `if (patched(\`feature-a\`)) { a(); }
       if (patched(\`feature-b\`)) { b(); }`,
    ],
    invalid: [
      // Duplicate patched IDs
      {
        code: `if (patched('my-feature')) {
                 newBehavior();
               }
               if (patched('my-feature')) {
                 alsoPatchedCode();
               }`,
        errors: [{ messageId: 'duplicatePatchId', data: { patchId: 'my-feature' } }],
      },

      // Duplicate deprecatePatch IDs
      {
        code: `deprecatePatch('old-code');
               deprecatePatch('old-code');`,
        errors: [{ messageId: 'duplicatePatchId', data: { patchId: 'old-code' } }],
      },

      // patched and deprecatePatch with same ID (could be intentional migration, but flag it)
      {
        code: `deprecatePatch('feature');
               if (patched('feature')) {
                 doSomething();
               }`,
        errors: [{ messageId: 'duplicatePatchId', data: { patchId: 'feature' } }],
      },

      // Multiple duplicates
      {
        code: `patched('a');
               patched('b');
               patched('a');
               patched('b');`,
        errors: [
          { messageId: 'duplicatePatchId', data: { patchId: 'a' } },
          { messageId: 'duplicatePatchId', data: { patchId: 'b' } },
        ],
      },

      // Template literal duplicates
      {
        code: 'if (patched(`my-patch`)) { a(); } if (patched(`my-patch`)) { b(); }',
        errors: [{ messageId: 'duplicatePatchId', data: { patchId: 'my-patch' } }],
      },
    ],
  });
});
