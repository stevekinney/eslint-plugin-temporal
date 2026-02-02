# eslint-plugin-temporal

[![npm version](https://img.shields.io/npm/v/eslint-plugin-temporal.svg)](https://www.npmjs.com/package/eslint-plugin-temporal)
[![CI](https://github.com/stevekinney/eslint-plugin-temporal/actions/workflows/ci.yml/badge.svg)](https://github.com/stevekinney/eslint-plugin-temporal/actions/workflows/ci.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

ESLint plugin for the [Temporal](https://temporal.io) TypeScript SDK. Provides rules to enforce best practices and prevent common mistakes across workflows, activities, workers, and clients.

## Installation

```bash
npm install --save-dev eslint-plugin-temporal
# or
bun add --dev eslint-plugin-temporal
```

**Requirements:**

- ESLint 9.0.0 or higher (flat config)
- TypeScript 5.0.0 or higher

## Quick Start

Add the plugin to your `eslint.config.js`:

```js
import temporal from 'eslint-plugin-temporal';

export default [temporal.configs.recommended];
```

That's it! The `recommended` config automatically detects the Temporal context (workflow, activity, worker, or client) based on your imports and applies the appropriate rules.

### How Auto-Detection Works

The plugin detects context using a priority system:

1. **Import-based detection** (most reliable):
   - `import { proxyActivities } from '@temporalio/workflow'` → workflow rules apply
   - `import { Context } from '@temporalio/activity'` → activity rules apply
   - `import { Worker } from '@temporalio/worker'` → worker rules apply
   - `import { Client } from '@temporalio/client'` → client rules apply
   - `import { TestWorkflowEnvironment } from '@temporalio/testing'` → test context (relaxed rules)

2. **File path detection** (fallback):
   - `**/workflows/**` → workflow rules
   - `**/activities/**` → activity rules
   - `**/worker/**` or `**/workers/**` → worker rules
   - `**/client/**` or `**/clients/**` → client rules

3. **Unknown context**: Only shared/universal rules apply

### Advanced: Explicit File Patterns

For projects with non-standard directory structures, you can still use explicit file patterns:

```js
import temporal from 'eslint-plugin-temporal';

export default [
  // Use explicit patterns for custom directory structures
  {
    files: ['src/temporal/workflows/**/*.ts'],
    ...temporal.configs.workflow,
  },
  {
    files: ['src/temporal/activities/**/*.ts'],
    ...temporal.configs.activity,
  },
  {
    files: ['src/temporal/worker/**/*.ts'],
    ...temporal.configs.worker,
  },
];
```

You can also keep auto-detection and customize the patterns with `settings.temporal.filePatterns`:

```js
import temporal from 'eslint-plugin-temporal';

export default [
  temporal.configs.recommended,
  {
    settings: {
      temporal: {
        filePatterns: {
          workflow: ['src/temporal/workflows/**'],
          activity: ['src/temporal/activities/**'],
        },
      },
    },
  },
];
```

## Configurations

| Configuration | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `recommended` | All rules with auto-detection. Rules apply based on detected context.          |
| `workflow`    | Strict determinism rules. Use with explicit `files` pattern for manual config. |
| `activity`    | Retry safety rules. Use with explicit `files` pattern for manual config.       |
| `worker`      | Clean bootstrap rules. Use with explicit `files` pattern for manual config.    |
| `client`      | Client code rules. Use with explicit `files` pattern for manual config.        |
| `strict`      | All rules enabled as errors. For maximum enforcement.                          |

## Documentation

- Rule docs: `docs/rules/`
- Settings: `docs/settings.md`
- Configs: `docs/configs.md`
- Docs consistency: `bun run docs:check`

### Docs contribution

When you add or rename rules, regenerate the docs and keep the README rule list in sync. Run `bun run docs:generate` followed by `bun run docs:check` before committing to catch missing or extra docs.

## Rules

All rules are included in both `recommended` and `strict` presets. The `recommended` preset uses a mix of `warn` and `error` severities, while `strict` sets all rules to `error`.

### Workflow Rules

| Rule                                                         | Description                                                                    | Fixable | Recommended |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ | :-----: | :---------: |
| `workflow-activity-timeout-duration-format`                  | Enforce consistent duration literal format for activity timeouts.              |         |    warn     |
| `workflow-await-cancel-requested-in-non-cancellable-pattern` | Suggest awaiting `cancelRequested` after `nonCancellable` cleanup.             |         |    warn     |
| `workflow-condition-timeout-style`                           | Enforce consistent timeout style for `condition()` calls.                      |         |    warn     |
| `workflow-deprecate-patch-requires-comment`                  | Require a comment explaining why `deprecatePatch` is being used.               |   Yes   |    warn     |
| `workflow-duration-format`                                   | Enforce consistent duration literal format (string vs ms number).              |         |    warn     |
| `workflow-local-activity-options-required`                   | Require timeouts and retry policy for `proxyLocalActivities()`.                |         |    warn     |
| `workflow-message-name-literal`                              | Require signal/query/update names to be string literals.                       |         |    warn     |
| `workflow-no-activity-definitions-import`                    | Disallow importing activity implementations. Use `proxyActivities()` instead.  |         |    error    |
| `workflow-no-any-in-workflow-public-api`                     | Disallow `any` in workflow public API payload types.                           |         |    warn     |
| `workflow-no-assert-in-production-workflow`                  | Disallow Node `assert` usage in workflow code outside tests.                   |         |    warn     |
| `workflow-no-async-query-handler`                            | Disallow `async` query handlers (queries must be synchronous).                 |         |    error    |
| `workflow-no-await-in-handler-without-exit-guard`            | Require `allHandlersFinished()` when handlers await work.                      |         |    warn     |
| `workflow-no-bigint-in-payload`                              | Disallow `bigint` in workflow payloads without a custom converter.             |         |    warn     |
| `workflow-no-busy-wait`                                      | Disallow busy-wait loops. Use `sleep()` or `condition()` instead.              |         |    error    |
| `workflow-no-client-import`                                  | Disallow importing `@temporalio/client` in workflow files.                     |         |    error    |
| `workflow-no-console`                                        | Disallow `console.*` in workflow files. Use `log` from `@temporalio/workflow`. |   Yes   |    error    |
| `workflow-no-continue-as-new-in-update-handler`              | Disallow calling `continueAsNew` inside update handlers.                       |         |    error    |
| `workflow-no-continue-as-new-without-state-argument`         | Require `continueAsNew()` to pass workflow state arguments.                    |         |    warn     |
| `workflow-no-crypto-random-uuid`                             | Disallow `crypto.randomUUID()`. Use `uuid4()` from `@temporalio/workflow`.     |         |    error    |
| `workflow-no-date-now-tight-loop`                            | Warn on multiple `Date.now()` calls without yielding.                          |         |    warn     |
| `workflow-no-date-object-in-payload`                         | Disallow `Date` objects in workflow payloads.                                  |         |    warn     |
| `workflow-no-duplicate-patch-ids`                            | Disallow duplicate patch IDs in the same workflow.                             |         |    error    |
| `workflow-no-dynamic-import`                                 | Disallow dynamic `import()` expressions in workflows.                          |         |    error    |
| `workflow-no-dynamic-require`                                | Disallow dynamic `require()` calls in workflows.                               |         |    error    |
| `workflow-no-error-as-payload`                               | Disallow `Error` objects in workflow payload types.                            |         |    warn     |
| `workflow-no-finalization-registry`                          | Disallow `FinalizationRegistry` in workflows (non-deterministic).              |         |    error    |
| `workflow-no-floating-promises`                              | Disallow floating (unhandled) promises in workflows.                           |         |    error    |
| `workflow-no-frequent-search-attribute-upserts`              | Warn when `upsertSearchAttributes` is called inside loops.                     |         |    warn     |
| `workflow-no-fs-in-workflow`                                 | Disallow filesystem access in workflows. Use activities for file I/O.          |         |    error    |
| `workflow-no-heavy-cpu-in-workflow`                          | Warn on CPU-heavy work in workflows (move to activities).                      |         |    warn     |
| `workflow-no-large-inline-constants`                         | Warn about large inline literals in workflow code.                             |         |    warn     |
| `workflow-no-large-literal-activity-payloads`                | Warn about large literal payloads sent to activities.                          |         |    warn     |
| `workflow-no-large-literal-payloads`                         | Warn about large literal payloads sent to child workflows.                     |         |    warn     |
| `workflow-no-logger-library-in-workflow`                     | Disallow logger libraries in workflows. Use the workflow `log` instead.        |         |    error    |
| `workflow-no-mixed-scope-exports`                            | Disallow exporting Worker/Client/Activity values from workflow files.          |         |    error    |
| `workflow-no-network-in-workflow`                            | Disallow network access in workflows. Use activities for HTTP calls.           |         |    error    |
| `workflow-no-node-or-dom-imports`                            | Disallow Node.js built-in modules and DOM APIs.                                |         |    error    |
| `workflow-no-nondeterministic-control-flow`                  | Warn when control flow depends on time/randomness without annotation.          |         |    warn     |
| `workflow-no-nonserializable-types-in-payloads`              | Disallow non-serializable types in workflow payloads.                          |         |    warn     |
| `workflow-no-process-env`                                    | Disallow `process.env` access (non-deterministic).                             |         |    error    |
| `workflow-no-query-mutation`                                 | Disallow state mutations inside query handlers.                                |         |    error    |
| `workflow-no-retry-for-nonidempotent-activities`             | Require `retry.maximumAttempts: 1` for non-idempotent activities.              |         |    warn     |
| `workflow-no-setinterval`                                    | Disallow `setInterval` (use `sleep()` in a loop instead).                      |         |    error    |
| `workflow-no-settimeout-in-cancellation-scope`               | Disallow `setTimeout` inside `CancellationScope` callbacks.                    |         |    warn     |
| `workflow-no-swallow-cancellation`                           | Require cancellation errors to be rethrown.                                    |         |    warn     |
| `workflow-no-throw-raw-error`                                | Prefer throwing `ApplicationFailure` over raw `Error`.                         |         |    warn     |
| `workflow-no-top-level-workflow-side-effects`                | Disallow scheduling workflow commands at module scope.                         |         |    error    |
| `workflow-no-unsafe-global-mutation`                         | Disallow mutating global state in workflows.                                   |         |    error    |
| `workflow-no-unsafe-package-imports`                         | Disallow importing packages unsafe for workflow determinism.                   |         |    error    |
| `workflow-no-uuid-library-in-workflow`                       | Disallow UUID libraries in workflows. Use `uuid4()` instead.                   |         |    error    |
| `workflow-no-wall-clock-assumptions`                         | Warn when comparing `Date.now()` to external timestamps in workflows.          |         |    warn     |
| `workflow-no-weakref`                                        | Disallow `WeakRef` in workflows (non-deterministic).                           |         |    error    |
| `workflow-no-worker-import`                                  | Disallow importing `@temporalio/worker` in workflow files.                     |         |    error    |
| `workflow-no-workflow-apis-in-query`                         | Disallow workflow APIs (`sleep`, `condition`, etc.) in query handlers.         |         |    error    |
| `workflow-no-workflow-prng-for-persisted-ids`                | Warn when workflow PRNG values are used for persisted IDs or payloads.         |         |    warn     |
| `workflow-non-cancellable-cleanup-required`                  | Require `CancellationScope.nonCancellable` for cleanup on cancellation.        |         |    warn     |
| `workflow-patch-id-literal`                                  | Require patch IDs to be string literals.                                       |         |    warn     |
| `workflow-patched-must-guard-incompatible-change`            | Require `patched()` to guard incompatible workflow changes.                    |         |    warn     |
| `workflow-prefer-cancellation-scope-with-timeout`            | Prefer `CancellationScope.withTimeout()` over `Promise.race` timeouts.         |         |    warn     |
| `workflow-prefer-condition-over-polling`                     | Prefer `condition()` over polling loops with `sleep()`.                        |         |    warn     |
| `workflow-prefer-local-activity-for-nondeterministic-value`  | Suggest generating nondeterministic values in local activities.                |         |    warn     |
| `workflow-prefer-single-object-args`                         | Prefer a single object parameter for workflows.                                |         |    warn     |
| `workflow-prefer-sleep`                                      | Prefer `sleep()` over `setTimeout` in workflows.                               |         |    warn     |
| `workflow-prefer-workflow-uuid`                              | Prefer `uuid4()` from `@temporalio/workflow` over other UUID libs.             |   Yes   |    error    |
| `workflow-replay-testing-required-comment`                   | Require a replay-tested comment when changing versioning logic.                |   Yes   |    warn     |
| `workflow-require-activity-retry-policy`                     | Suggest configuring retry policies for activities.                             |         |    warn     |
| `workflow-require-activity-timeouts`                         | Require timeout configuration when calling `proxyActivities()`.                |         |    error    |
| `workflow-require-all-handlers-finished`                     | Suggest using `allHandlersFinished()` before workflow completion.              |         |    warn     |
| `workflow-require-deprecate-patch-after-branch-removal`      | Require `deprecatePatch()` after removing a patched fallback branch.           |         |    warn     |
| `workflow-require-explicit-payload-types`                    | Require explicit payload types for workflows and handlers.                     |         |    warn     |
| `workflow-require-handler-serialization-safe-types`          | Require handler args/returns to be payload-serializable.                       |         |    warn     |
| `workflow-require-idempotency-key-arg`                       | Require idempotency keys for non-idempotent activity calls.                    |         |    warn     |
| `workflow-require-message-definitions-at-module-scope`       | Require `defineSignal`/`defineQuery`/`defineUpdate` at module scope.           |         |    warn     |
| `workflow-require-set-handler-early`                         | Suggest registering signal/query handlers early in the workflow.               |         |    warn     |
| `workflow-require-type-only-activity-imports`                | Require type-only imports for activity type definitions.                       |         |    error    |
| `workflow-search-attributes-upsert-shape`                    | Require `upsertSearchAttributes` values to be arrays (use `[]` to remove).     |         |    warn     |
| `workflow-signal-handler-returns-void`                       | Require signal handlers to return `void`.                                      |         |    error    |
| `workflow-sink-args-must-be-cloneable`                       | Require sink call arguments to be cloneable data.                              |         |    warn     |
| `workflow-sink-no-await`                                     | Disallow awaiting sink calls (sinks are fire-and-forget).                      |         |    error    |
| `workflow-sink-no-return-value`                              | Disallow using return values from sink calls.                                  |         |    error    |
| `workflow-update-handler-return-type`                        | Suggest explicit return types for update handlers.                             |         |    warn     |
| `workflow-uuid4-requires-security-comment`                   | Require a comment noting `uuid4()` is deterministic and not secure.            |   Yes   |    warn     |

### Activity Rules

| Rule                                 | Description                                                                          | Fixable | Recommended |
| ------------------------------------ | ------------------------------------------------------------------------------------ | :-----: | :---------: |
| `activity-context-not-stored`        | Disallow storing Activity Context in variables that persist across async boundaries. |         |    error    |
| `activity-heartbeat-in-long-loops`   | Suggest calling `heartbeat()` in loops that contain `await` expressions.             |         |    warn     |
| `activity-prefer-activity-log`       | Prefer `log` from `@temporalio/activity` over `console.*` for structured logging.    |   Yes   |    warn     |
| `activity-prefer-applicationfailure` | Prefer throwing `ApplicationFailure` over raw `Error` in activities.                 |         |    warn     |
| `activity-prefer-single-object-args` | Prefer a single object parameter for activities.                                     |         |    warn     |
| `activity-use-cancellation-signal`   | Suggest passing cancellation signal to HTTP clients in activities.                   |         |    warn     |

### Worker Rules

| Rule                                         | Description                                                                     | Fixable | Recommended |
| -------------------------------------------- | ------------------------------------------------------------------------------- | :-----: | :---------: |
| `worker-ignoremodules-requires-comment`      | Require a comment explaining why modules are being ignored in `bundlerOptions`. |   Yes   |    warn     |
| `worker-no-workflow-or-activity-definitions` | Disallow importing workflow or activity definitions directly in worker files.   |         |    error    |
| `worker-require-call-during-replay-explicit` | Require explicit `callDuringReplay` on sink definitions.                        |         |    warn     |

### Client Rules

| Rule                         | Description                                                                  | Fixable | Recommended |
| ---------------------------- | ---------------------------------------------------------------------------- | :-----: | :---------: |
| `client-require-workflow-id` | Require explicit `workflowId` when starting workflows to ensure idempotency. |         |    warn     |

### Test Rules

| Rule                              | Description                                                                                   | Fixable | Recommended |
| --------------------------------- | --------------------------------------------------------------------------------------------- | :-----: | :---------: |
| `replay-history-smoke-test-hook`  | Require a replay history smoke test hook exporting a function calling `runReplayHistories()`. |         |    warn     |
| `test-import-type-for-activities` | Require type-only imports for activity modules in tests.                                      |         |    warn     |
| `test-teardown-required`          | Require `TestWorkflowEnvironment.teardown()` in `afterAll`/`afterEach`.                       |         |    warn     |
| `test-worker-run-until-required`  | Require `worker.runUntil(...)` when creating Workers in tests.                                |         |    warn     |

### Shared Rules

| Rule                                    | Description                                                          | Fixable | Recommended |
| --------------------------------------- | -------------------------------------------------------------------- | :-----: | :---------: |
| `no-temporal-internal-imports`          | Disallow importing from internal Temporal SDK paths.                 |   Yes   |    error    |
| `no-workflow-and-activity-in-same-file` | Disallow mixing workflow and activity code in the same file.         |         |    error    |
| `task-queue-constant`                   | Suggest using a constant for task queue names to ensure consistency. |         |    warn     |

## License

ISC
