import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { updateHandlerReturnType } from './update-handler-return-type.ts';

const ruleTester = createBasicRuleTester();

describe('update-handler-return-type', () => {
  ruleTester.run('update-handler-return-type', updateHandlerReturnType, {
    valid: [
      // Update handler with explicit return type
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, (value: string): string => {
          state = value;
          return state;
        });
      `,

      // Async update handler with explicit return type
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, async (value: string): Promise<string> => {
          state = value;
          return state;
        });
      `,

      // Function expression with return type
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, function(value: string): string {
          state = value;
          return state;
        });
      `,

      // Signal handler without return type (doesn't need one)
      `
        const mySignal = defineSignal('mySignal');
        setHandler(mySignal, (value) => {
          state = value;
        });
      `,

      // Query handler without return type (separate concern)
      `
        const myQuery = defineQuery('myQuery');
        setHandler(myQuery, () => state);
      `,

      // Update handler with void return type (explicit is fine)
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, (value): void => {
          state = value;
        });
      `,

      // Complex return type
      `
        const myUpdate = defineUpdate('myUpdate');
        setHandler(myUpdate, (value): { success: boolean; data: string } => {
          state = value;
          return { success: true, data: state };
        });
      `,
    ],
    invalid: [
      // Update handler without return type (arrow function)
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, (value) => {
            state = value;
            return state;
          });
        `,
        errors: [{ messageId: 'missingReturnType' }],
      },

      // Async update handler without return type
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, async (value) => {
            state = value;
            return state;
          });
        `,
        errors: [{ messageId: 'missingReturnType' }],
      },

      // Function expression without return type
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, function(value) {
            state = value;
            return state;
          });
        `,
        errors: [{ messageId: 'missingReturnType' }],
      },

      // Expression body arrow function without return type
      {
        code: `
          const myUpdate = defineUpdate('myUpdate');
          setHandler(myUpdate, (value) => state = value);
        `,
        errors: [{ messageId: 'missingReturnType' }],
      },

      // Inline defineUpdate without return type
      {
        code: `
          setHandler(defineUpdate('myUpdate'), (value) => {
            state = value;
            return state;
          });
        `,
        errors: [{ messageId: 'missingReturnType' }],
      },
    ],
  });
});
