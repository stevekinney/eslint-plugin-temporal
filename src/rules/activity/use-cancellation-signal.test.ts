import { describe } from 'bun:test';

import { createBasicRuleTester } from '../../test-utilities/rule-tester.ts';
import { useCancellationSignal } from './use-cancellation-signal.ts';

const ruleTester = createBasicRuleTester();

describe('use-cancellation-signal', () => {
  ruleTester.run('use-cancellation-signal', useCancellationSignal, {
    valid: [
      // fetch with signal
      `fetch(url, { signal: Context.current().cancellationSignal });`,
      `fetch(url, { signal: cancellationSignal });`,
      `fetch(url, { signal, headers: {} });`,

      // axios with signal
      `axios.get(url, { signal: cancellationSignal });`,
      `axios({ url, signal: cancellationSignal });`,

      // axios with cancelToken (older API)
      `axios.get(url, { cancelToken: source.token });`,

      // got with signal
      `got(url, { signal: cancellationSignal });`,

      // Not an HTTP client
      `myFunction();`,
      `process(data);`,

      // Custom client not in default list
      `superagent.get(url);`,
    ],
    invalid: [
      // fetch without signal
      {
        code: `fetch(url);`,
        errors: [{ messageId: 'missingSignal', data: { client: 'fetch' } }],
      },
      {
        code: `fetch(url, { headers: {} });`,
        errors: [{ messageId: 'missingSignal', data: { client: 'fetch' } }],
      },

      // axios without signal
      {
        code: `axios.get(url);`,
        errors: [{ messageId: 'missingSignal', data: { client: 'axios' } }],
      },
      {
        code: `axios({ url, method: 'GET' });`,
        errors: [{ messageId: 'missingSignal', data: { client: 'axios' } }],
      },

      // got without signal
      {
        code: `got(url);`,
        errors: [{ messageId: 'missingSignal', data: { client: 'got' } }],
      },

      // ky without signal
      {
        code: `ky.get(url);`,
        errors: [{ messageId: 'missingSignal', data: { client: 'ky' } }],
      },

      // Custom client list
      {
        code: `customFetch(url);`,
        options: [{ httpClients: ['customFetch'] }],
        errors: [{ messageId: 'missingSignal', data: { client: 'customFetch' } }],
      },
    ],
  });
});
