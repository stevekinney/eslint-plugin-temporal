import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noSharedArrayBuffer } from './no-shared-array-buffer.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-shared-array-buffer', () => {
  ruleTester.run('no-shared-array-buffer', noSharedArrayBuffer, {
    valid: [
      // Regular ArrayBuffer usage
      `const buf = new ArrayBuffer(16);`,

      // Property named SharedArrayBuffer
      `const obj = { SharedArrayBuffer: 'value' };`,

      // Accessing SharedArrayBuffer property
      `obj.SharedArrayBuffer = value;`,

      // Property named Atomics
      `const obj = { Atomics: 'value' };`,

      // Accessing Atomics property
      `obj.Atomics = value;`,

      // Type annotation (allowed for typing)
      `function process(buf: SharedArrayBuffer) {}`,

      // Type reference
      `type MyBuf = SharedArrayBuffer;`,
    ],
    invalid: [
      // Creating a SharedArrayBuffer
      {
        code: `const buf = new SharedArrayBuffer(1024);`,
        errors: [{ messageId: 'noSharedArrayBuffer' }],
      },

      // Assigning SharedArrayBuffer to a variable
      {
        code: `const Buf = SharedArrayBuffer;`,
        errors: [{ messageId: 'noSharedArrayBuffer' }],
      },

      // Passing SharedArrayBuffer as argument
      {
        code: `registerType(SharedArrayBuffer);`,
        errors: [{ messageId: 'noSharedArrayBuffer' }],
      },

      // Using Atomics.wait
      {
        code: `Atomics.wait(buffer, 0, 0);`,
        errors: [{ messageId: 'noAtomics' }],
      },

      // Using Atomics.store
      {
        code: `Atomics.store(buffer, 0, 42);`,
        errors: [{ messageId: 'noAtomics' }],
      },

      // Using Atomics.load
      {
        code: `const val = Atomics.load(buffer, 0);`,
        errors: [{ messageId: 'noAtomics' }],
      },

      // Assigning Atomics to a variable
      {
        code: `const ops = Atomics;`,
        errors: [{ messageId: 'noAtomics' }],
      },

      // Using SharedArrayBuffer in array
      {
        code: `const types = [SharedArrayBuffer, ArrayBuffer];`,
        errors: [{ messageId: 'noSharedArrayBuffer' }],
      },
    ],
  });
});
