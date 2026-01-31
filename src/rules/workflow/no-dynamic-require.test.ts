import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDynamicRequire } from './no-dynamic-require.ts';

const ruleTester = createBasicRuleTester();

describe('no-dynamic-require', () => {
  ruleTester.run('no-dynamic-require', noDynamicRequire, {
    valid: [
      // ES module imports are fine
      `import { something } from 'some-module';`,
      `import * as mod from 'some-module';`,
      `import defaultExport from 'some-module';`,

      // Dynamic import (separate concern, but generally allowed in workflows with proxyActivities)
      `const mod = await import('some-module');`,

      // Function named require but not a call
      `const requireFunc = (x) => x;`,
      `function require(x) { return x; }`,

      // Member expression require
      `const x = obj.require('module');`,
      `const x = this.require('module');`,
    ],
    invalid: [
      // Basic require call
      {
        code: `const mod = require('some-module');`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // require with variable argument
      {
        code: `const mod = require(moduleName);`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // require with template literal
      {
        code: `const mod = require(\`./modules/\${name}\`);`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // require in expression
      {
        code: `const { foo } = require('some-module');`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // Conditional require
      {
        code: `const mod = condition ? require('a') : require('b');`,
        errors: [{ messageId: 'noDynamicRequire' }, { messageId: 'noDynamicRequire' }],
      },

      // require inside function
      {
        code: `
          function loadModule() {
            return require('dynamic-module');
          }
        `,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // require with path join
      {
        code: `const mod = require(path.join(__dirname, 'module'));`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },

      // require.resolve (still uses require)
      {
        code: `const resolved = require('some-module');`,
        errors: [{ messageId: 'noDynamicRequire' }],
      },
    ],
  });
});
