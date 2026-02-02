import { describe } from 'bun:test';

import { createActivityRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferActivityLog } from './prefer-activity-log.ts';

const ruleTester = createActivityRuleTester();

describe('prefer-activity-log', () => {
  ruleTester.run('prefer-activity-log', preferActivityLog, {
    valid: [
      // Using Temporal activity log
      `import { log } from '@temporalio/activity';
       log.info('Processing request');`,

      // Other loggers (not console)
      `logger.info('message');`,
      `myLogger.log('message');`,
    ],
    invalid: [
      // console.log
      {
        code: `console.log('message');`,
        output: `import { log } from '@temporalio/activity';
log.info('message');`,
        errors: [{ messageId: 'preferActivityLog' }],
      },

      // console.error
      {
        code: `console.error('error');`,
        output: `import { log } from '@temporalio/activity';
log.error('error');`,
        errors: [{ messageId: 'preferActivityLog' }],
      },

      // With existing Temporal import
      {
        code: `import { Context } from '@temporalio/activity';
console.log('message');`,
        output: `import { Context, log } from '@temporalio/activity';
log.info('message');`,
        errors: [{ messageId: 'preferActivityLog' }],
      },

      // With log already imported
      {
        code: `import { log } from '@temporalio/activity';
console.log('message');`,
        output: `import { log } from '@temporalio/activity';
log.info('message');`,
        errors: [{ messageId: 'preferActivityLog' }],
      },
    ],
  });
});
