import { describe } from 'bun:test';

import { createTestRuleTester } from '../../test-utilities/rule-tester.ts';
import { replayHistorySmokeTestHook } from './replay-history-smoke-test-hook.ts';

const ruleTester = createTestRuleTester();

describe('replay-history-smoke-test-hook', () => {
  ruleTester.run('replay-history-smoke-test-hook', replayHistorySmokeTestHook, {
    valid: [
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/replay-histories-hook.ts',
            exportName: 'runReplayHistorySmokeTest',
            reportOnce: false,
          },
        ],
      },
    ],
    invalid: [
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/missing-replay-hook.ts',
            exportName: 'runReplayHistorySmokeTest',
            reportOnce: false,
          },
        ],
        errors: [{ messageId: 'missingHookFile' }],
      },
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/replay-histories-no-export.ts',
            exportName: 'runReplayHistorySmokeTest',
            reportOnce: false,
          },
        ],
        errors: [{ messageId: 'missingHookExport' }],
      },
    ],
  });
});
