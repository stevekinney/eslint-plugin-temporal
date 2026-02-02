import { describe } from 'bun:test';

import { createActivityRuleTester } from '../../test-utilities/rule-tester.ts';
import { contextNotStored } from './context-not-stored.ts';

const ruleTester = createActivityRuleTester();

describe('context-not-stored', () => {
  ruleTester.run('context-not-stored', contextNotStored, {
    valid: [
      // Direct usage is fine
      `Context.current().heartbeat();`,
      `const signal = Context.current().cancellationSignal;`,
      `const info = Context.current().info;`,

      // Using it inline in a function call
      `doSomething(Context.current().info);`,

      // Destructuring properties directly (accessing current() each time)
      `const { cancellationSignal } = Context.current();`,

      // Not Context.current()
      `const ctx = getContext();`,
      `const ctx = myContext.current();`,
    ],
    invalid: [
      // Storing context in a variable
      {
        code: `const ctx = Context.current();`,
        errors: [{ messageId: 'contextNotStored' }],
      },
      {
        code: `let context = Context.current();`,
        errors: [{ messageId: 'contextNotStored' }],
      },
      {
        code: `var activityContext = Context.current();`,
        errors: [{ messageId: 'contextNotStored' }],
      },

      // Assignment
      {
        code: `let ctx; ctx = Context.current();`,
        errors: [{ messageId: 'contextNotStored' }],
      },

      // In function
      {
        code: `
          async function myActivity() {
            const ctx = Context.current();
            await doSomething();
            ctx.heartbeat(); // This could be stale!
          }
        `,
        errors: [{ messageId: 'contextNotStored' }],
      },
    ],
  });
});
