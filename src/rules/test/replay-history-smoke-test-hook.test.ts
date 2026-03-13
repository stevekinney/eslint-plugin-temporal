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
      // Arrow function export pattern should also be valid
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/replay-histories-arrow-export.ts',
            exportName: 'runReplayHistorySmokeTest',
            reportOnce: false,
          },
        ],
      },
      // requireRunReplayHistories disabled should pass even without call
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/replay-histories-no-replay-call.ts',
            exportName: 'runReplayHistorySmokeTest',
            requireRunReplayHistories: false,
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
      // File exists and has export but is missing runReplayHistories() call
      {
        code: `const ok = true;`,
        options: [
          {
            hookFile: 'src/__fixtures__/replay-histories-no-replay-call.ts',
            exportName: 'runReplayHistorySmokeTest',
            reportOnce: false,
          },
        ],
        errors: [{ messageId: 'missingReplayCall' }],
      },
    ],
  });
});
