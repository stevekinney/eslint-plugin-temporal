import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { sinkArgsMustBeCloneable } from './sink-args-must-be-cloneable.ts';

const ruleTester = createWorkflowRuleTester();

describe('sink-args-must-be-cloneable', () => {
  ruleTester.run('sink-args-must-be-cloneable', sinkArgsMustBeCloneable, {
    valid: [
      `const sinks = proxySinks();
       sinks.logger.info({ message: 'ok', tags: ['a', 'b'] });`,

      `const sinks = proxySinks();
       const payload = { message: 'ok' };
       sinks.logger.info(payload);`,

      `const sinks = proxySinks();
       const ids = [1, 2, 3];
       sinks.logger.info(ids);`,

      `const sinks = proxySinks();
       sinks.logger.info([1, { nested: ['ok'] }]);`,
    ],
    invalid: [
      {
        code: `const sinks = proxySinks();
          sinks.logger.info(() => {});`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
      {
        code: `const sinks = proxySinks();
          sinks.logger.info({ cb: () => {} });`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
      {
        code: `const sinks = proxySinks();
          const err = new Error('nope');
          sinks.logger.info(err);`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
      {
        code: `const sinks = proxySinks();
          class Logger {}
          const logger = new Logger();
          sinks.logger.info(logger);`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
      {
        code: `const sinks = proxySinks();
          function handler() {}
          sinks.logger.info(handler);`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
      {
        code: `const sinks = proxySinks();
          sinks.logger.info([() => {}]);`,
        errors: [{ messageId: 'sinkArgsMustBeCloneable' }],
      },
    ],
  });
});
