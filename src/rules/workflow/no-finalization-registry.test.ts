import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noFinalizationRegistry } from './no-finalization-registry.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-finalization-registry', () => {
  ruleTester.run('no-finalization-registry', noFinalizationRegistry, {
    valid: [
      // Regular cleanup patterns
      `function cleanup() { resource.dispose(); }`,

      // Other identifiers
      `const registry = new Map();`,

      // Property named FinalizationRegistry
      `const obj = { FinalizationRegistry: 'value' };`,

      // Accessing FinalizationRegistry property
      `obj.FinalizationRegistry = value;`,

      // Type annotation (allowed for typing)
      `function process(reg: FinalizationRegistry<object>) {}`,

      // Type reference
      `type MyRegistry = FinalizationRegistry<SomeType>;`,
    ],
    invalid: [
      // Creating a FinalizationRegistry
      {
        code: `const registry = new FinalizationRegistry((heldValue) => {
          console.log('cleaned up', heldValue);
        });`,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },

      // FinalizationRegistry without new (would throw at runtime)
      {
        code: `const registry = FinalizationRegistry(callback);`,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },

      // Assigning FinalizationRegistry to a variable
      {
        code: `const Registry = FinalizationRegistry;`,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },

      // Passing FinalizationRegistry as argument
      {
        code: `registerType(FinalizationRegistry);`,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },

      // Using FinalizationRegistry in array
      {
        code: `const types = [FinalizationRegistry, WeakMap];`,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },

      // Using register method
      {
        code: `
          const registry = new FinalizationRegistry(cleanup);
          registry.register(obj, heldValue);
        `,
        errors: [{ messageId: 'noFinalizationRegistry' }],
      },
    ],
  });
});
