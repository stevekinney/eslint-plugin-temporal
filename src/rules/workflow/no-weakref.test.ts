import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { noWeakRef } from './no-weakref.ts';

const ruleTester = createBasicRuleTester();

describe('no-weakref', () => {
  ruleTester.run('no-weakref', noWeakRef, {
    valid: [
      // Regular object usage
      `const ref = { current: value };`,

      // Other identifiers named similarly
      `const weakReference = createRef();`,

      // Property named WeakRef
      `const obj = { WeakRef: 'value' };`,

      // Accessing WeakRef property
      `obj.WeakRef = value;`,

      // Type annotation (allowed for typing)
      `function process(ref: WeakRef<object>) {}`,

      // Type reference
      `type MyRef = WeakRef<SomeType>;`,
    ],
    invalid: [
      // Creating a WeakRef
      {
        code: `const ref = new WeakRef(target);`,
        errors: [{ messageId: 'noWeakRef' }],
      },

      // WeakRef without new (would throw at runtime anyway)
      {
        code: `const ref = WeakRef(target);`,
        errors: [{ messageId: 'noWeakRef' }],
      },

      // Assigning WeakRef to a variable
      {
        code: `const RefConstructor = WeakRef;`,
        errors: [{ messageId: 'noWeakRef' }],
      },

      // Passing WeakRef as argument
      {
        code: `registerConstructor(WeakRef);`,
        errors: [{ messageId: 'noWeakRef' }],
      },

      // Using WeakRef in array
      {
        code: `const constructors = [WeakRef, Map];`,
        errors: [{ messageId: 'noWeakRef' }],
      },
    ],
  });
});
