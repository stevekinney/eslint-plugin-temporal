import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { sinkNoReturnValue } from './sink-no-return-value.ts';

const ruleTester = createWorkflowRuleTester();

describe('sink-no-return-value', () => {
  ruleTester.run('sink-no-return-value', sinkNoReturnValue, {
    valid: [
      // Fire and forget (correct usage)
      `
        const sinks = proxySinks();
        sinks.myLogger.info('message');
      `,

      // Statement expression (not using return value)
      `
        const sinks = proxySinks();
        sinks.analytics.track('event');
        doSomethingElse();
      `,

      // Regular activity return values are fine
      `
        const activities = proxyActivities();
        const result = await activities.doSomething();
      `,

      // Regular function return values
      `
        const result = someFunction();
      `,

      // Deeply nested member expression where object.object is not Identifier
      `
        const sinks = proxySinks();
        const result = getSinks().logger.info('message');
      `,

      // Sink call in expression statement
      `
        const sinks = proxySinks();
        if (condition) {
          sinks.logger.info('logged');
        }
      `,
    ],
    invalid: [
      // Assigning sink return value
      {
        code: `
          const sinks = proxySinks();
          const result = sinks.myLogger.info('message');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Reassigning to sink return value
      {
        code: `
          const sinks = proxySinks();
          let result;
          result = sinks.analytics.track('event');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Returning sink result
      {
        code: `
          const sinks = proxySinks();
          function logAndReturn() {
            return sinks.logger.info('message');
          }
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Using sink call as argument
      {
        code: `
          const sinks = proxySinks();
          processResult(sinks.logger.info('message'));
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Using sink call in array
      {
        code: `
          const sinks = proxySinks();
          const results = [sinks.logger.info('message')];
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Using sink call in object
      {
        code: `
          const sinks = proxySinks();
          const obj = { result: sinks.logger.info('message') };
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Using sink call in conditional
      {
        code: `
          const sinks = proxySinks();
          const x = condition ? sinks.logger.info('a') : other;
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Using sink call in logical expression
      {
        code: `
          const sinks = proxySinks();
          const x = sinks.logger.info('message') || fallback;
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Awaiting sink return value assigned to variable
      {
        code: `
          const sinks = proxySinks();
          const result = await sinks.logger.info('message');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Computed property access on sink proxy (e.g., sinks['myLogger'].info())
      {
        code: `
          const sinks = proxySinks();
          const result = sinks.myLogger['info']('message');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Sink call used as right side of conditional expression (ternary alternate)
      {
        code: `
          const sinks = proxySinks();
          const x = other ? fallback : sinks.logger.warn('warning');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },

      // Sink proxy via member expression — nested deeper (sinks.myLogger.nested still tracked)
      {
        code: `
          const sinks = proxySinks();
          return sinks.analytics.track('event');
        `,
        errors: [{ messageId: 'sinkNoReturnValue' }],
      },
    ],
  });
});
