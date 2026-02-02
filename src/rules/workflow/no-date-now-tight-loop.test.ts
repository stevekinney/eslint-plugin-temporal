import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noDateNowTightLoop } from './no-date-now-tight-loop.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-date-now-tight-loop', () => {
  ruleTester.run('no-date-now-tight-loop', noDateNowTightLoop, {
    valid: [
      `import { sleep } from '@temporalio/workflow';
       const start = Date.now();
       await sleep('1s');
       const end = Date.now();`,
      `const now = Date.now();`,
      `async function helper() {
         const start = Date.now();
         await doWork();
         const end = Date.now();
       }`,
    ],
    invalid: [
      {
        code: `const start = Date.now();
        const end = Date.now();`,
        errors: [{ messageId: 'dateNowTightLoop' }],
      },
      {
        code: `if (ready) {
          const a = Date.now();
          const b = Date.now();
        }`,
        errors: [{ messageId: 'dateNowTightLoop' }],
      },
      {
        code: `const first = Date.now();
        if (ready) {
          doWork();
        }
        const second = Date.now();`,
        errors: [{ messageId: 'dateNowTightLoop' }],
      },
    ],
  });
});
