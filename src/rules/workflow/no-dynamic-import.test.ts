import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDynamicImport } from './no-dynamic-import.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-dynamic-import', () => {
  ruleTester.run('no-dynamic-import', noDynamicImport, {
    valid: [
      // Static imports are fine
      `import { foo } from './foo';`,
      `import * as bar from './bar';`,
      `import type { Baz } from './baz';`,

      // Re-exports are fine
      `export { foo } from './foo';`,
      `export * from './bar';`,
    ],
    invalid: [
      // Basic dynamic import
      {
        code: `const module = await import('./module');`,
        errors: [{ messageId: 'noDynamicImport' }],
      },

      // Dynamic import with variable
      {
        code: `const modulePath = './module';
               const module = await import(modulePath);`,
        errors: [{ messageId: 'noDynamicImport' }],
      },

      // Dynamic import with template literal
      {
        code: 'const module = await import(`./modules/${name}`);',
        errors: [{ messageId: 'noDynamicImport' }],
      },

      // Dynamic import in then callback
      {
        code: `import('./module').then(m => m.doSomething());`,
        errors: [{ messageId: 'noDynamicImport' }],
      },

      // Conditional dynamic import
      {
        code: `if (condition) {
          const module = await import('./conditional');
        }`,
        errors: [{ messageId: 'noDynamicImport' }],
      },

      // Multiple dynamic imports
      {
        code: `const a = await import('./a');
               const b = await import('./b');`,
        errors: [{ messageId: 'noDynamicImport' }, { messageId: 'noDynamicImport' }],
      },
    ],
  });
});
