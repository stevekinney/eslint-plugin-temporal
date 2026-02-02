import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { sinkNoAwait } from './sink-no-await.ts';

const ruleTester = createWorkflowRuleTester();

describe('sink-no-await', () => {
  ruleTester.run('sink-no-await', sinkNoAwait, {
    valid: [
      // Sink call without await (correct usage)
      `
        const sinks = proxySinks();
        sinks.myLogger.info('message');
      `,

      // Multiple sink calls without await
      `
        const sinks = proxySinks();
        sinks.logger.info('starting');
        sinks.analytics.track('event');
        sinks.logger.info('done');
      `,

      // Awaiting regular activities (not sinks)
      `
        const activities = proxyActivities();
        await activities.doSomething();
      `,

      // Awaiting something else
      `await sleep(1000);`,

      // Regular function calls
      `
        const result = await fetch('https://example.com');
      `,

      // Not using proxySinks variable name
      `
        const notSinks = { logger: { info: () => {} } };
        await notSinks.logger.info('message');
      `,
    ],
    invalid: [
      // Awaiting sink call (one level deep)
      {
        code: `
          const sinks = proxySinks();
          await sinks.myLogger('message');
        `,
        errors: [{ messageId: 'sinkNoAwait' }],
      },

      // Awaiting sink call (two levels deep)
      {
        code: `
          const sinks = proxySinks();
          await sinks.myLogger.info('message');
        `,
        errors: [{ messageId: 'sinkNoAwait' }],
      },

      // Multiple awaited sink calls
      {
        code: `
          const sinks = proxySinks();
          await sinks.logger.info('start');
          await sinks.logger.info('end');
        `,
        errors: [{ messageId: 'sinkNoAwait' }, { messageId: 'sinkNoAwait' }],
      },

      // Awaiting sink in expression
      {
        code: `
          const sinks = proxySinks();
          const result = await sinks.analytics.track('event');
        `,
        errors: [{ messageId: 'sinkNoAwait' }],
      },

      // Different sink variable name
      {
        code: `
          const mySinks = proxySinks();
          await mySinks.logger.warn('warning');
        `,
        errors: [{ messageId: 'sinkNoAwait' }],
      },
    ],
  });
});
