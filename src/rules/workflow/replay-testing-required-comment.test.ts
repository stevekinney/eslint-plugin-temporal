import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { replayTestingRequiredComment } from './replay-testing-required-comment.ts';

const ruleTester = createWorkflowRuleTester();

describe('replay-testing-required-comment', () => {
  ruleTester.run('replay-testing-required-comment', replayTestingRequiredComment, {
    valid: [
      `// replay-tested: 2025-02-02
patched('feature');`,
      `/* replay tested */
continueAsNew(state);`,
      `// replay-tested
deprecatePatch('feature');`,
      `const value = 42;
export { value };`,
    ],
    invalid: [
      {
        code: `patched('feature');`,
        output: `// replay-tested: YYYY-MM-DD
patched('feature');`,
        errors: [{ messageId: 'replayTestedCommentRequired' }],
      },
      {
        code: `continueAsNew(state);`,
        output: `// replay-tested: YYYY-MM-DD
continueAsNew(state);`,
        errors: [{ messageId: 'replayTestedCommentRequired' }],
      },
      {
        code: `deprecatePatch('feature');`,
        output: `// replay-tested: YYYY-MM-DD
deprecatePatch('feature');`,
        errors: [{ messageId: 'replayTestedCommentRequired' }],
      },
      // Test with multiple versioning calls (only first gets comment)
      {
        code: `if (patched('feature')) {
  newBehavior();
}
deprecatePatch('old-feature');`,
        output: `// replay-tested: YYYY-MM-DD
if (patched('feature')) {
  newBehavior();
}
deprecatePatch('old-feature');`,
        errors: [{ messageId: 'replayTestedCommentRequired' }],
      },
    ],
  });
});
