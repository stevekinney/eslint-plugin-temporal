import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const OUTPUT_DIR = 'docs/rules';
const ROOT = 'src/rules';

const contextLabels: Record<string, string> = {
  workflow: 'Workflow',
  activity: 'Activity',
  worker: 'Worker',
  client: 'Client',
  shared: 'Shared',
};

const whyByRule: Record<string, string> = {
  'workflow-condition-timeout-style':
    'Consistent condition() timeout usage prevents accidental infinite waits and keeps workflow timing behavior reviewable.',
  'workflow-deprecate-patch-requires-comment':
    'Patch lifecycles are version-sensitive. A comment documents why a patch can be deprecated so future maintainers do not remove it prematurely and break replay compatibility.',
  'workflow-patched-must-guard-incompatible-change':
    'patched() should guard incompatible code paths so replay behavior is explicit and safe during version transitions.',
  'workflow-require-deprecatePatch-after-branch-removal':
    'Once the old branch is removed, deprecatePatch makes the versioning lifecycle explicit and prevents accidental replay failures.',
  'workflow-replay-testing-required-comment':
    'Replay testing catches nondeterminism. A replay-tested comment documents that verification for versioning changes.',
  'workflow-duration-format':
    'Mixing duration formats makes timers harder to read and audit. A consistent style reduces mistakes when reasoning about timeouts.',
  'workflow-activity-timeout-duration-format':
    'Consistent activity timeout formats make proxyActivities options easier to review and prevent unit mix-ups.',
  'workflow-message-name-literal':
    'Signal/query/update names are part of your public API. Literals (or stable constants) prevent accidental renames that break clients.',
  'workflow-require-message-definitions-at-module-scope':
    'Defining messages at module scope keeps handler identities stable and avoids redefining them on every workflow activation.',
  'workflow-prefer-CancellationScope-withTimeout':
    'CancellationScope.withTimeout integrates with Temporal cancellation semantics and avoids ad-hoc timeout races.',
  'workflow-no-settimeout-in-cancellation-scope':
    'setTimeout bypasses Temporal’s cancellation semantics. sleep() ensures timers respect workflow cancellation.',
  'workflow-no-swallow-cancellation':
    'Swallowing cancellation can leave workflows in an inconsistent state. Rethrowing preserves cancellation semantics.',
  'workflow-nonCancellable-cleanup-required':
    'Cleanup during cancellation should run inside a non-cancellable scope to ensure it completes safely.',
  'workflow-await-cancelRequested-in-nonCancellable-pattern':
    'Awaiting cancelRequested after non-cancellable cleanup keeps workflow cancellation behavior explicit and predictable.',
  'workflow-no-activity-definitions-import':
    'Workflow code runs in the deterministic sandbox. Importing activity implementations can pull in Node APIs and nondeterminism; only proxy activities from the workflow API.',
  'workflow-no-async-query-handler':
    'Queries must be synchronous and side-effect free. Async queries can block workflow tasks and introduce nondeterminism during replay.',
  'workflow-no-busy-wait':
    'Busy-wait loops block the workflow task and can cause timeouts. Use Temporal timers or conditions to yield control.',
  'workflow-no-client-import':
    'Workflows cannot use the Temporal Client. Client calls are non-deterministic and must be done in activities or by workflow APIs.',
  'workflow-no-console':
    'Console output is not replay-aware and can duplicate logs. Workflow logging integrates with Temporal and is safe for replay.',
  'workflow-no-continueAsNew-in-update-handler':
    'Update handlers should complete within the current run. Continuing as new inside a handler can interrupt in-flight updates and violate update semantics.',
  'workflow-no-continueAsNew-without-state-argument':
    'continueAsNew starts a new run with fresh inputs. Passing state forward prevents accidental resets and replay issues.',
  'workflow-no-crypto-random-uuid':
    'crypto.randomUUID() is nondeterministic. Use uuid4() in workflows or generate IDs in activities when you need true randomness.',
  'workflow-no-date-now-tight-loop':
    'Workflow time only advances with timers. Multiple Date.now() calls without yielding can mislead logic and create replay surprises.',
  'workflow-no-duplicate-patch-ids':
    'Patch IDs define version gates. Duplicates make versioning ambiguous and can lead to incorrect replay behavior.',
  'workflow-no-dynamic-import':
    'Dynamic imports can bypass bundling guarantees and lead to runtime differences between replays. Keep workflow dependencies static.',
  'workflow-no-dynamic-require':
    'Dynamic require() breaks bundling assumptions and can introduce nondeterministic module loading during replay.',
  'workflow-no-finalization-registry':
    'FinalizationRegistry depends on garbage collection timing, which is nondeterministic and unsafe for workflow replay.',
  'workflow-no-fs-in-workflow':
    'Workflows run in a sandbox without filesystem access. File I/O must happen in activities.',
  'workflow-no-floating-promises':
    'Unhandled promises can lead to lost work or nondeterministic ordering. Workflows should await or explicitly manage all async work.',
  'workflow-no-heavy-cpu-in-workflow':
    'CPU-heavy work can block the workflow task and slow replays. Move expensive computation to activities.',
  'workflow-no-large-literal-activity-payloads':
    'Activity payloads are stored in workflow history. Large literals bloat history, slow replays, and increase storage costs.',
  'workflow-no-large-literal-payloads':
    'Child workflow payloads are stored in history. Large literals bloat history, slow replays, and increase storage costs.',
  'workflow-no-large-inline-constants':
    'Large inline literals increase workflow bundle size and memory use. Move big constants out of workflow code.',
  'workflow-no-nonserializable-types-in-payloads':
    'Workflow payloads must be serializable. Disallowing non-serializable types avoids runtime payload converter failures.',
  'workflow-no-error-as-payload':
    'Error objects do not serialize cleanly. Use structured error shapes when passing errors as payloads.',
  'workflow-no-bigint-in-payload':
    'bigint is not JSON-serializable by default. Convert to string/number or configure a payload converter.',
  'workflow-no-date-object-in-payload':
    'Date objects are not JSON-serializable by default. Use ISO strings or epoch values.',
  'workflow-require-explicit-payload-types':
    'Explicit payload types make workflow APIs and message contracts clear and stable.',
  'workflow-no-any-in-workflow-public-api':
    'Avoiding any in public workflow APIs improves correctness and keeps payload contracts explicit.',
  'workflow-no-logger-library-in-workflow':
    'Logger libraries can perform I/O and are not replay-aware. Use the workflow logger instead.',
  'workflow-no-mixed-scope-exports':
    'Workflow modules should only export workflow code and message definitions. Exporting workers or clients blurs runtime boundaries.',
  'workflow-no-network-in-workflow':
    'Network calls are nondeterministic and not allowed in workflow code. Use activities for I/O.',
  'workflow-no-node-or-dom-imports':
    'Workflows run in a restricted sandbox without Node or DOM APIs. Importing them will fail at runtime or break determinism.',
  'workflow-no-nondeterministic-control-flow':
    'Branching on time or randomness can break replay when code evolves. Require an explicit comment to make the choice intentional.',
  'workflow-no-process-env':
    'Environment variables can change between runs and replays. Pass configuration explicitly via workflow inputs.',
  'workflow-no-query-mutation':
    'Queries must be read-only. Mutating state in a query can cause nondeterministic behavior and violates the query contract.',
  'workflow-no-await-in-handler-without-exit-guard':
    'Async handlers can still be running when a workflow exits. Waiting on allHandlersFinished avoids dropping in-flight handler work.',
  'workflow-no-retry-for-nonidempotent-activities':
    'Retries can duplicate side effects for non-idempotent activities. Limiting retries avoids accidental double-charges or writes.',
  'workflow-no-setinterval':
    'setInterval is not replay-safe and can ignore cancellation semantics. Use sleep in a loop or condition().',
  'workflow-no-throw-raw-error':
    'ApplicationFailure preserves retryability and failure semantics. Throwing raw Error can hide intent and break retry policies.',
  'workflow-no-unsafe-global-mutation':
    'Mutating globals or prototypes can cause replay divergence across workers and versions.',
  'workflow-no-unsafe-package-imports':
    'Many packages perform I/O or use nondeterministic sources. Keeping workflow dependencies safe prevents replay failures.',
  'workflow-no-uuid-library-in-workflow':
    'UUID libraries typically rely on randomness. Use uuid4() or generate IDs in activities.',
  'workflow-no-wall-clock-assumptions':
    'Workflow time is deterministic and advances with timers. Comparing Date.now() to external timestamps can encode brittle wall-clock assumptions.',
  'workflow-no-weakref':
    'WeakRef depends on garbage collection timing, which is nondeterministic and unsafe for workflow replay.',
  'workflow-no-worker-import':
    'Workers run outside the workflow sandbox. Importing worker code into workflows crosses environment boundaries and breaks determinism.',
  'workflow-no-workflow-apis-in-query':
    'Query handlers must be synchronous and side-effect free. Calling workflow APIs schedules commands and violates query semantics.',
  'workflow-patch-id-literal':
    'Patch IDs are long-lived version gates. Literals ensure they remain stable and searchable across the codebase.',
  'workflow-prefer-condition-over-polling':
    'Polling with timers creates extra workflow tasks and history. condition() is more efficient and replay-friendly.',
  'workflow-prefer-sleep':
    'sleep() is workflow-aware and cancellation-safe. setTimeout wrappers can behave differently under replay.',
  'workflow-prefer-single-object-args':
    'Single object inputs make workflow APIs easier to extend without breaking callers.',
  'workflow-prefer-workflow-uuid':
    'uuid4() is deterministic under Temporal’s replay model. Third-party UUIDs often rely on randomness.',
  'workflow-require-idempotency-key-arg':
    'Idempotency keys let you safely retry or dedupe non-idempotent activities that touch external systems.',
  'workflow-require-activity-retry-policy':
    'Retries are part of activity semantics. Explicit policies make behavior reviewable and prevent surprises in production.',
  'workflow-require-activity-timeouts':
    'Timeouts prevent stuck activities and make workflow progress deterministic under failure conditions.',
  'workflow-require-all-handlers-finished':
    'Signals and updates may still be running when a workflow returns. Waiting ensures in-flight handlers complete safely.',
  'workflow-require-handler-serialization-safe-types':
    'Handler inputs and outputs become workflow payloads. Enforcing serialization-safe types prevents runtime payload failures.',
  'workflow-require-setHandler-early':
    'Handlers registered after the first await can miss signals/updates. Registering early ensures deterministic handling.',
  'workflow-require-type-only-activity-imports':
    'Type-only imports keep activity implementations out of the workflow bundle, preserving sandbox safety.',
  'workflow-signal-handler-returns-void':
    'Signal handlers do not return values to callers. Enforcing void return types keeps APIs honest and predictable.',
  'workflow-sink-no-await':
    'Sinks are fire-and-forget. Awaiting them can block workflow progress and mislead about delivery guarantees.',
  'workflow-sink-no-return-value':
    'Sink calls do not return values. Using their return values is a logic error that can hide missed side effects.',
  'workflow-update-handler-return-type':
    'Update handlers are part of your workflow API. Explicit return types prevent accidental breaking changes.',
  'workflow-uuid4-requires-security-comment':
    'uuid4() is deterministic and not cryptographically secure. A comment helps prevent accidental misuse for security tokens.',
  'activity-prefer-activity-log':
    'Activity logs include Temporal context and are structured for observability. console.* loses metadata and consistency.',
  'activity-prefer-applicationfailure':
    'ApplicationFailure captures retryability and failure type. Raw Error can lead to unintended retries or opaque failures.',
  'activity-prefer-single-object-args':
    'Single object inputs make activity APIs easier to extend without breaking callers.',
  'activity-heartbeat-in-long-loops':
    'Heartbeats allow cancellation and progress reporting. Long loops without heartbeats can run indefinitely after cancellation.',
  'activity-use-cancellation-signal':
    'Passing cancellation signals lets HTTP clients abort work promptly, saving resources and preventing wasted retries.',
  'activity-context-not-stored':
    'Activity Context is attempt-specific. Storing it across async boundaries can use stale data or miss cancellation.',
  'worker-no-workflow-or-activity-definitions':
    'Workers should load workflows by path and pass activity implementations explicitly. Importing definitions can bundle code into the wrong environment.',
  'worker-ignoremodules-requires-comment':
    'Ignoring modules affects workflow bundling and can hide nondeterminism. A comment makes the safety trade-off explicit.',
  'client-require-workflow-id':
    'Workflow IDs provide idempotency and de-duplication. Omitting them can create duplicate workflows on retries.',
  'task-queue-constant':
    'Task queue names are shared across workers and clients. Constants prevent typos and make refactors safe.',
  'no-temporal-internal-imports':
    'Internal SDK paths are not stable APIs. Using public entry points prevents breakage on SDK upgrades.',
  'no-workflow-and-activity-in-same-file':
    'Workflows and activities run in different environments. Mixing them in one module risks importing the wrong runtime dependencies.',
};

function extractDescription(text: string): string {
  const template = text.match(/description:\s*`([\s\S]*?)`/);
  const templateValue = template?.[1];
  if (templateValue) return templateValue.replace(/\s+/g, ' ').trim();
  const single = text.match(/description:\s*'([\s\S]*?)'/);
  const singleValue = single?.[1];
  if (singleValue) return singleValue.replace(/\s+/g, ' ').trim();
  const double = text.match(/description:\s*"([\s\S]*?)"/);
  const doubleValue = double?.[1];
  if (doubleValue) return doubleValue.replace(/\s+/g, ' ').trim();
  return 'Rule description pending.';
}

function extractRuleName(text: string): string | null {
  const match = text.match(/name:\s*['"]([^'"]+)['"]/);
  return match?.[1] ?? null;
}

function extractPropertiesBlock(text: string): string | null {
  const idx = text.indexOf('properties:');
  if (idx === -1) return null;
  const start = text.indexOf('{', idx);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return text.slice(start + 1, i);
    }
  }
  return null;
}

function extractOptions(text: string): string[] | null {
  if (/schema:\s*\[\s*\]/.test(text)) return [];
  const schemaBlockMatch = text.match(/schema:\s*\[([\s\S]*?)\]/);
  const schemaBlock = schemaBlockMatch?.[1];
  if (!schemaBlock) return null;
  const propsBlock = extractPropertiesBlock(schemaBlock);
  if (!propsBlock) return null;
  const matches = [...propsBlock.matchAll(/\n(\s*)([a-zA-Z0-9_]+):/g)];
  if (!matches.length) return null;
  const minIndent = Math.min(...matches.map((match) => (match[1] ?? '').length));
  const props = matches
    .filter((match) => (match[1] ?? '').length === minIndent)
    .map((match) => match[2])
    .filter(
      (name): name is string =>
        typeof name === 'string' &&
        !['type', 'items', 'description', 'additionalProperties'].includes(name),
    );
  return props.length ? props : null;
}

function extractFixable(text: string): string | null {
  const match = text.match(/fixable:\s*['"](code|whitespace)['"]/);
  return match?.[1] ?? null;
}

function firstTemplateLiteral(text: string): string | null {
  const match = text.match(/`([\s\S]*?)`/);
  return match?.[1] ?? null;
}

function firstCodeInSection(section: string): string | null {
  const codeMatch = section.match(/code:\s*`([\s\S]*?)`/);
  if (codeMatch?.[1]) return codeMatch[1];
  return firstTemplateLiteral(section);
}

function dedent(code: string | null): string {
  if (!code) return '// Example pending.';
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && (lines[0] ?? '').trim() === '') lines.shift();
  while (lines.length && (lines[lines.length - 1] ?? '').trim() === '') {
    lines.pop();
  }
  const indents = lines
    .filter((line) => line.trim().length)
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const minIndent = indents.length ? Math.min(...indents) : 0;
  return lines
    .map((line) => line.slice(minIndent))
    .join('\n')
    .trim();
}

function extractExamples(testText: string): { valid: string; invalid: string } {
  const validSplit = testText.split(/valid\s*:\s*\[/);
  const invalidSplit = testText.split(/invalid\s*:\s*\[/);

  const validSection = validSplit[1]?.split(/invalid\s*:\s*\[/)[0] ?? '';
  const invalidSection = invalidSplit[1] ?? '';

  const valid = firstCodeInSection(validSection);
  const invalid = firstCodeInSection(invalidSection);

  return {
    valid: dedent(valid),
    invalid: dedent(invalid),
  };
}

function whyText(description: string, context: string, ruleName: string): string {
  const fromMap = whyByRule[ruleName];
  if (fromMap) return fromMap;
  const label = contextLabels[context] || 'Temporal';
  const lower = description.charAt(0).toLowerCase() + description.slice(1);
  return `${label} code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that ${lower}`;
}

function disableText(ruleName: string, context: string): string {
  const label = contextLabels[context] || 'Temporal';
  if (ruleName.includes('no-')) {
    return `Disable if your ${label.toLowerCase()} code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.`;
  }
  if (ruleName.includes('prefer-')) {
    return `Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in ${label.toLowerCase()} code.`;
  }
  if (ruleName.includes('require-')) {
    return `Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.`;
  }
  return `Disable only if you have a documented exception for this rule in ${label.toLowerCase()} code.`;
}

function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function generateDocs(): void {
  ensureOutputDir();

  const contexts = ['workflow', 'activity', 'worker', 'client', 'shared'];

  for (const context of contexts) {
    const dir = join(ROOT, context);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir)
      .filter((file) => file.endsWith('.ts'))
      .filter((file) => !file.endsWith('.test.ts') && file !== 'index.ts');

    for (const file of files) {
      const filePath = join(dir, file);
      const text = readFileSync(filePath, 'utf8');
      const ruleName = extractRuleName(text);
      if (!ruleName) continue;

      const description = extractDescription(text);
      const options = extractOptions(text);
      const fixable = extractFixable(text);

      const testPath = join(dir, `${basename(file, '.ts')}.test.ts`);
      let examples = { valid: '// Example pending.', invalid: '// Example pending.' };
      if (existsSync(testPath)) {
        const testText = readFileSync(testPath, 'utf8');
        examples = extractExamples(testText);
      }

      const optionLines =
        options === null
          ? ['See the rule schema in the source for supported options.']
          : options.length === 0
            ? ['None.']
            : options.map((opt) => `- ${opt}`);

      const docLines = [
        `# ${ruleName}`,
        '',
        '## What it does',
        '',
        description,
        '',
        '## Why it matters',
        whyText(description, context, ruleName),
        '',
        '## Options',
        '',
        ...optionLines,
        '',
        '## Autofix',
        '',
        fixable ? `Yes (fixable: ${fixable}).` : 'No.',
        '',
        '## Examples',
        '',
        '### Incorrect',
        '',
        '```ts',
        examples.invalid,
        '```',
        '',
        '### Correct',
        '',
        '```ts',
        examples.valid,
        '```',
        '',
        '## When to disable',
        '',
        disableText(ruleName, context),
        '',
      ];

      writeFileSync(join(OUTPUT_DIR, `${ruleName}.md`), docLines.join('\n'));
    }
  }
}

generateDocs();
