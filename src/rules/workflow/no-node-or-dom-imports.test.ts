import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noNodeOrDomImports } from './no-node-or-dom-imports.ts';

const ruleTester = createBasicRuleTester();

describe('no-node-or-dom-imports', () => {
  ruleTester.run('no-node-or-dom-imports', noNodeOrDomImports, {
    valid: [
      // Temporal imports are fine
      `import { proxyActivities } from '@temporalio/workflow';`,
      `import { log } from '@temporalio/workflow';`,

      // NPM packages are fine (handled by different rule)
      `import lodash from 'lodash';`,
      `import { z } from 'zod';`,

      // Relative imports are fine
      `import { helper } from './utilities';`,

      // Regular function calls (not DOM globals)
      `const myFetch = () => {}; myFetch();`,
      `myDocument.title;`,
    ],
    invalid: [
      // Node.js built-in imports
      {
        code: `import fs from 'fs';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'fs' } }],
      },
      {
        code: `import { readFile } from 'fs';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'fs' } }],
      },
      {
        code: `import { readFile } from 'fs/promises';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'fs/promises' } }],
      },
      {
        code: `import path from 'path';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'path' } }],
      },
      {
        code: `import { join } from 'node:path';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'node:path' } }],
      },
      {
        code: `import crypto from 'node:crypto';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'node:crypto' } }],
      },
      {
        code: `import http from 'http';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'http' } }],
      },
      {
        code: `import { spawn } from 'child_process';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'child_process' } }],
      },
      {
        code: `import os from 'os';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'os' } }],
      },
      {
        code: `import net from 'net';`,
        errors: [{ messageId: 'noNodeImport', data: { module: 'net' } }],
      },

      // DOM API usage
      {
        code: `const title = document.title;`,
        errors: [{ messageId: 'noDomApi' }],
      },
      {
        code: `window.location.href = '/';`,
        errors: [{ messageId: 'noDomApi' }],
      },
      {
        code: `localStorage.setItem('key', 'value');`,
        errors: [{ messageId: 'noDomApi' }],
      },
      {
        code: `const data = sessionStorage.getItem('key');`,
        errors: [{ messageId: 'noDomApi' }],
      },
      {
        code: `navigator.userAgent;`,
        errors: [{ messageId: 'noDomApi' }],
      },
    ],
  });
});
