import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { deprecatePatchRequiresComment } from './deprecate-patch-requires-comment.ts';

const ruleTester = createBasicRuleTester();

describe('deprecate-patch-requires-comment', () => {
  ruleTester.run('deprecate-patch-requires-comment', deprecatePatchRequiresComment, {
    valid: [
      // With leading comment
      `// Safe to deprecate: all v1 workflows completed as of 2024-01-01
       deprecatePatch('feature-v1');`,

      // With block comment
      `/* Introduced in v2.0, all v1.x workflows have finished */
       deprecatePatch('old-feature');`,

      // With inline trailing comment
      `deprecatePatch('legacy'); // Deployed 6 months ago, safe to remove`,

      // patched() doesn't need a comment
      `if (patched('my-feature')) {
         newBehavior();
       }`,

      // Comment on separate line above
      `// All workflows using the old path have completed
       deprecatePatch('migration-v1');`,
    ],
    invalid: [
      // No comment at all
      {
        code: `deprecatePatch('feature-v1');`,
        errors: [{ messageId: 'requiresComment' }],
      },

      // Comment too far away (after other code)
      {
        code: `doSomething();
               deprecatePatch('feature');`,
        errors: [{ messageId: 'requiresComment' }],
      },

      // Multiple deprecatePatch without comments
      {
        code: `deprecatePatch('feature-a');
               deprecatePatch('feature-b');`,
        errors: [{ messageId: 'requiresComment' }, { messageId: 'requiresComment' }],
      },
    ],
  });
});
