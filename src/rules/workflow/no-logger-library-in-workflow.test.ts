import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noLoggerLibraryInWorkflow } from './no-logger-library-in-workflow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-logger-library-in-workflow', () => {
  ruleTester.run('no-logger-library-in-workflow', noLoggerLibraryInWorkflow, {
    valid: [
      `import { log } from '@temporalio/workflow';
       log.info('hello');`,
      `const logger = createLogger();
       logger.info('ok');`,
      `import type { Logger } from 'pino';
       export type { Logger };`,
    ],
    invalid: [
      {
        code: `import pino from 'pino';`,
        errors: [{ messageId: 'noLoggerLibrary' }],
      },
      {
        code: `import winston from 'winston';`,
        errors: [{ messageId: 'noLoggerLibrary' }],
      },
      {
        code: `const logger = require('bunyan');`,
        errors: [{ messageId: 'noLoggerLibrary' }],
      },
      {
        code: `export { createLogger } from 'log4js';`,
        errors: [{ messageId: 'noLoggerLibrary' }],
      },
    ],
  });
});
