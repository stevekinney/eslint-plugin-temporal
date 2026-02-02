import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noUnsafeGlobalMutation } from './no-unsafe-global-mutation.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-unsafe-global-mutation', () => {
  ruleTester.run('no-unsafe-global-mutation', noUnsafeGlobalMutation, {
    valid: [
      // Regular assignments
      `const foo = 'bar';`,
      `let x = 1; x = 2;`,

      // Object property assignment
      `const obj = {}; obj.foo = 'bar';`,

      // Local class prototype modification
      `class MyClass {} MyClass.prototype.foo = function() {};`,

      // Reading from globalThis is fine
      `const x = globalThis.something;`,

      // Object.assign on local objects
      `const obj = {}; Object.assign(obj, { foo: 'bar' });`,

      // Object.defineProperty on local objects
      `const obj = {}; Object.defineProperty(obj, 'foo', { value: 'bar' });`,

      // Using prototype to read
      `const proto = Object.prototype;`,

      // Custom object with prototype property
      `const myObj = { prototype: {} }; myObj.prototype.foo = 'bar';`,
    ],
    invalid: [
      // Direct globalThis mutation
      {
        code: `globalThis.foo = 'bar';`,
        errors: [
          {
            messageId: 'noGlobalMutation',
            data: { global: 'globalThis' },
          },
        ],
      },

      // global mutation
      {
        code: `global.customProp = 'value';`,
        errors: [
          {
            messageId: 'noGlobalMutation',
            data: { global: 'global' },
          },
        ],
      },

      // window mutation
      {
        code: `window.myGlobal = {};`,
        errors: [
          {
            messageId: 'noGlobalMutation',
            data: { global: 'window' },
          },
        ],
      },

      // self mutation
      {
        code: `self.customMethod = function() {};`,
        errors: [
          {
            messageId: 'noGlobalMutation',
            data: { global: 'self' },
          },
        ],
      },

      // Object.prototype mutation
      {
        code: `Object.prototype.customMethod = function() {};`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Object' },
          },
        ],
      },

      // Array.prototype mutation
      {
        code: `Array.prototype.myFilter = function() {};`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Array' },
          },
        ],
      },

      // String.prototype mutation
      {
        code: `String.prototype.trim2 = function() {};`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'String' },
          },
        ],
      },

      // Object.defineProperty on prototype
      {
        code: `Object.defineProperty(Object.prototype, 'foo', { value: 'bar' });`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Object' },
          },
        ],
      },

      // Object.defineProperties on prototype
      {
        code: `Object.defineProperties(Array.prototype, { myMethod: { value: function() {} } });`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Array' },
          },
        ],
      },

      // Object.assign to globalThis
      {
        code: `Object.assign(globalThis, { myGlobal: 'value' });`,
        errors: [
          {
            messageId: 'noGlobalMutation',
            data: { global: 'globalThis' },
          },
        ],
      },

      // Object.setPrototypeOf on built-in prototype
      {
        code: `Object.setPrototypeOf(Array.prototype, {});`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Array' },
          },
        ],
      },

      // Promise.prototype mutation
      {
        code: `Promise.prototype.always = function() {};`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Promise' },
          },
        ],
      },

      // Map.prototype mutation
      {
        code: `Map.prototype.getOrDefault = function() {};`,
        errors: [
          {
            messageId: 'noPrototypeMutation',
            data: { object: 'Map' },
          },
        ],
      },
    ],
  });
});
