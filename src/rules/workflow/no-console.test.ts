import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noConsole } from './no-console.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-console', () => {
  ruleTester.run('no-console', noConsole, {
    valid: [
      // Using log from @temporalio/workflow
      `import { log } from '@temporalio/workflow';
       log.info('hello');`,

      // Not a call expression (just a reference)
      `const method = console.log;`,

      // Other objects with log method
      `logger.info('hello');`,
      `myConsole.log('hello');`,
    ],
    invalid: [
      // Basic console.log
      {
        code: `console.log('hello');`,
        output: `import { log } from '@temporalio/workflow';
log.info('hello');`,
        errors: [{ messageId: 'noConsole', data: { method: 'log', logMethod: 'info' } }],
      },

      // console.error
      {
        code: `console.error('error');`,
        output: `import { log } from '@temporalio/workflow';
log.error('error');`,
        errors: [
          {
            messageId: 'noConsole',
            data: { method: 'error', logMethod: 'error' },
          },
        ],
      },

      // console.warn
      {
        code: `console.warn('warning');`,
        output: `import { log } from '@temporalio/workflow';
log.warn('warning');`,
        errors: [{ messageId: 'noConsole', data: { method: 'warn', logMethod: 'warn' } }],
      },

      // console.info
      {
        code: `console.info('info');`,
        output: `import { log } from '@temporalio/workflow';
log.info('info');`,
        errors: [{ messageId: 'noConsole', data: { method: 'info', logMethod: 'info' } }],
      },

      // console.debug
      {
        code: `console.debug('debug');`,
        output: `import { log } from '@temporalio/workflow';
log.debug('debug');`,
        errors: [
          {
            messageId: 'noConsole',
            data: { method: 'debug', logMethod: 'debug' },
          },
        ],
      },

      // With existing Temporal import (should add specifier)
      {
        code: `import { proxyActivities } from '@temporalio/workflow';
console.log('hello');`,
        output: `import { proxyActivities, log } from '@temporalio/workflow';
log.info('hello');`,
        errors: [{ messageId: 'noConsole' }],
      },

      // With log already imported (should only fix the call)
      {
        code: `import { log } from '@temporalio/workflow';
console.log('hello');`,
        output: `import { log } from '@temporalio/workflow';
log.info('hello');`,
        errors: [{ messageId: 'noConsole' }],
      },

      // Multiple console calls - multiple autofix passes
      {
        code: `console.log('a');
console.error('b');`,
        output: [
          `import { log } from '@temporalio/workflow';
log.info('a');
console.error('b');`,
          `import { log } from '@temporalio/workflow';
log.info('a');
log.error('b');`,
        ],
        errors: [{ messageId: 'noConsole' }, { messageId: 'noConsole' }],
      },
    ],
  });
});
