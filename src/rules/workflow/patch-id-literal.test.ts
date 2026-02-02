import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { patchIdLiteral } from './patch-id-literal.ts';

const ruleTester = createWorkflowRuleTester();

describe('patch-id-literal', () => {
  ruleTester.run('patch-id-literal', patchIdLiteral, {
    valid: [
      // String literal
      `if (patched('my-patch-id')) { /* new code */ }`,
      `if (patched("another-patch")) { /* new code */ }`,

      // Template literal without expressions
      `if (patched(\`static-patch-id\`)) { /* new code */ }`,

      // deprecatePatch with literal
      `deprecatePatch('old-patch-id');`,

      // Not patched/deprecatePatch
      `someOtherFunction(variable);`,
      `patched.something('id');`,
    ],
    invalid: [
      // Variable
      {
        code: `const id = 'patch-id'; if (patched(id)) {}`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },

      // Expression
      {
        code: `if (patched('prefix-' + suffix)) {}`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },

      // Template literal with expressions
      {
        code: `if (patched(\`patch-\${version}\`)) {}`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },

      // Function call
      {
        code: `if (patched(getPatchId())) {}`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },

      // deprecatePatch with variable
      {
        code: `const patchId = 'old-patch'; deprecatePatch(patchId);`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },

      // Object property access
      {
        code: `if (patched(config.patchId)) {}`,
        errors: [{ messageId: 'patchIdMustBeLiteral' }],
      },
    ],
  });
});
