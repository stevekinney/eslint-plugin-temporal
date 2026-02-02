import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createContextRule } from '../../utilities/create-context-rule.ts';

type Options = [
  {
    hookFile?: string;
    exportName?: string;
    requireRunReplayHistories?: boolean;
    reportOnce?: boolean;
  },
];

type MessageIds = 'missingHookFile' | 'missingHookExport' | 'missingReplayCall';

const DEFAULT_HOOK_FILE = 'src/__tests__/replay-histories.test.ts';
const DEFAULT_EXPORT_NAME = 'runReplayHistorySmokeTest';

const reportedByCwd = new Set<string>();

function hasExportedFunction(source: string, exportName: string | undefined): boolean {
  if (exportName) {
    const namedFunction = new RegExp(
      `export\\s+(async\\s+)?function\\s+${exportName}\\b`,
    );
    const namedConst = new RegExp(
      `export\\s+const\\s+${exportName}\\s*=\\s*(async\\s*)?\\(`,
    );
    const namedArrow = new RegExp(
      `export\\s+const\\s+${exportName}\\s*=\\s*(async\\s*)?\\([^)]*\\)\\s*=>`,
    );
    return (
      namedFunction.test(source) || namedConst.test(source) || namedArrow.test(source)
    );
  }

  return (
    /export\s+(async\s+)?function\s+\w+/.test(source) ||
    /export\s+const\s+\w+\s*=\s*(async\s*)?\(/.test(source) ||
    /export\s+const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(source) ||
    /export\s+default\s+(async\s*)?function/.test(source)
  );
}

export const replayHistorySmokeTestHook = createContextRule<Options, MessageIds>('test', {
  name: 'replay-history-smoke-test-hook',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a replay history smoke test hook file that exports a function invoking Worker.runReplayHistories().',
    },
    messages: {
      missingHookFile:
        'Replay history smoke test hook file "{{ hookFile }}" was not found. Add a hook that calls Worker.runReplayHistories() in CI.',
      missingHookExport:
        'Replay history smoke test hook must export a function (expected export: "{{ exportName }}").',
      missingReplayCall:
        'Replay history smoke test hook should call Worker.runReplayHistories() to validate workflow replay safety.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          hookFile: {
            type: 'string',
            description:
              'Path to the replay history hook file (relative to project root).',
          },
          exportName: {
            type: 'string',
            description: 'Name of the exported hook function.',
          },
          requireRunReplayHistories: {
            type: 'boolean',
            description: 'Require the hook file to call Worker.runReplayHistories().',
          },
          reportOnce: {
            type: 'boolean',
            description: 'Only report this rule once per lint run.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const hookFile = options.hookFile ?? DEFAULT_HOOK_FILE;
    const exportName = options.exportName ?? DEFAULT_EXPORT_NAME;
    const requireRunReplayHistories = options.requireRunReplayHistories ?? true;
    const reportOnce = options.reportOnce ?? true;

    return {
      Program(node) {
        const cwd = process.cwd();
        if (reportOnce && reportedByCwd.has(cwd)) return;

        const hookPath = resolve(cwd, hookFile);
        if (!existsSync(hookPath)) {
          if (reportOnce) reportedByCwd.add(cwd);
          context.report({
            node,
            messageId: 'missingHookFile',
            data: { hookFile },
          });
          return;
        }

        const source = readFileSync(hookPath, 'utf8');
        if (!hasExportedFunction(source, exportName)) {
          if (reportOnce) reportedByCwd.add(cwd);
          context.report({
            node,
            messageId: 'missingHookExport',
            data: { exportName },
          });
          return;
        }

        if (requireRunReplayHistories && !/runReplayHistories\s*\(/.test(source)) {
          if (reportOnce) reportedByCwd.add(cwd);
          context.report({
            node,
            messageId: 'missingReplayCall',
          });
          return;
        }

        if (reportOnce) reportedByCwd.add(cwd);
      },
    };
  },
});
