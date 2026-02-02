import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { messageNameLiteral } from './message-name-literal.ts';

const ruleTester = createWorkflowRuleTester();

describe('message-name-literal', () => {
  ruleTester.run('message-name-literal', messageNameLiteral, {
    valid: [
      // String literals
      `const mySignal = defineSignal('my-signal');`,
      `const myQuery = defineQuery('my-query');`,
      `const myUpdate = defineUpdate('my-update');`,

      // Template literals without expressions
      `const mySignal = defineSignal(\`my-signal\`);`,

      // Const string references
      `
        const SIGNAL_NAME = 'my-signal';
        const mySignal = defineSignal(SIGNAL_NAME);
      `,

      // With type parameters
      `const mySignal = defineSignal<[string, number]>('my-signal');`,
      `const myQuery = defineQuery<string, [number]>('my-query');`,
      `const myUpdate = defineUpdate<string, [number], void>('my-update');`,

      // Multiple definitions
      `
        const signalA = defineSignal('signal-a');
        const signalB = defineSignal('signal-b');
        const queryA = defineQuery('query-a');
        const updateA = defineUpdate('update-a');
      `,

      // Non-Temporal function calls with same names (member expressions not checked)
      `const result = otherLib.defineSignal(dynamicName);`,
      `const result = otherLib.defineQuery(dynamicName);`,
      `const result = otherLib.defineUpdate(dynamicName);`,
      `const result = myDefineQuery(variable);`,

      // No arguments (let TypeScript handle this)
      `const mySignal = defineSignal();`,
    ],
    invalid: [
      // Variable reference (not const)
      {
        code: `
          let signalName = 'my-signal';
          const mySignal = defineSignal(signalName);
        `,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },

      // Function call result
      {
        code: `const mySignal = defineSignal(getName());`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },

      // Template literal with expression
      {
        code: `const mySignal = defineSignal(\`signal-\${version}\`);`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },

      // Concatenation
      {
        code: `const mySignal = defineSignal('signal-' + suffix);`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },

      // For defineQuery
      {
        code: `const myQuery = defineQuery(getQueryName());`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineQuery' },
          },
        ],
      },

      // For defineUpdate
      {
        code: `const myUpdate = defineUpdate(config.updateName);`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineUpdate' },
          },
        ],
      },

      // Object property access
      {
        code: `const mySignal = defineSignal(SIGNALS.mySignal);`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },

      // Array access
      {
        code: `const mySignal = defineSignal(signalNames[0]);`,
        errors: [
          {
            messageId: 'messageNameLiteral',
            data: { functionName: 'defineSignal' },
          },
        ],
      },
    ],
  });
});
