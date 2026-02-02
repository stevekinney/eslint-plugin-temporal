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

- Rule docs: `documentation/rules/`
- Settings: `documentation/settings.md`
- Configs: `documentation/configs.md`
- Docs consistency: `bun run docs:check`

### Docs contribution

When you add or rename rules, regenerate the docs and keep the README rule list in sync. Run `bun run docs:generate` followed by `bun run docs:check` before committing to catch missing or extra docs.

## Rules

All rules are included in both `recommended` and `strict` presets. The `recommended` preset uses a mix of `warn` and `error` severities, while `strict` sets all rules to `error`.

### Workflow Rules

| Rule                                                                                    | Description                                                                    | Fixable | Recommended |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | :-----: | :---------: |
| [`workflow-activity-timeout-duration-format`](documentation/rules/.md)                  | Enforce consistent duration literal format for activity timeouts.              |         |    warn     |
| [`workflow-await-cancel-requested-in-non-cancellable-pattern`](documentation/rules/.md) | Suggest awaiting `cancelRequested` after `nonCancellable` cleanup.             |         |    warn     |
| [`workflow-condition-timeout-style`](documentation/rules/.md)                           | Enforce consistent timeout style for `condition()` calls.                      |         |    warn     |
| [`workflow-deprecate-patch-requires-comment`](documentation/rules/.md)                  | Require a comment explaining why `deprecatePatch` is being used.               |   Yes   |    warn     |
| [`workflow-duration-format`](documentation/rules/.md)                                   | Enforce consistent duration literal format (string vs ms number).              |         |    warn     |
| [`workflow-local-activity-options-required`](documentation/rules/.md)                   | Require timeouts and retry policy for `proxyLocalActivities()`.                |         |    warn     |
| [`workflow-message-name-literal`](documentation/rules/.md)                              | Require signal/query/update names to be string literals.                       |         |    warn     |
| [`workflow-no-activity-definitions-import`](documentation/rules/.md)                    | Disallow importing activity implementations. Use `proxyActivities()` instead.  |         |    error    |
| [`workflow-no-any-in-workflow-public-api`](documentation/rules/.md)                     | Disallow `any` in workflow public API payload types.                           |         |    warn     |
| [`workflow-no-assert-in-production-workflow`](documentation/rules/.md)                  | Disallow Node `assert` usage in workflow code outside tests.                   |         |    warn     |
| [`workflow-no-async-query-handler`](documentation/rules/.md)                            | Disallow `async` query handlers (queries must be synchronous).                 |         |    error    |
| [`workflow-no-await-in-handler-without-exit-guard`](documentation/rules/.md)            | Require `allHandlersFinished()` when handlers await work.                      |         |    warn     |
| [`workflow-no-bigint-in-payload`](documentation/rules/.md)                              | Disallow `bigint` in workflow payloads without a custom converter.             |         |    warn     |
| [`workflow-no-busy-wait`](documentation/rules/.md)                                      | Disallow busy-wait loops. Use `sleep()` or `condition()` instead.              |         |    error    |
| [`workflow-no-client-import`](documentation/rules/.md)                                  | Disallow importing `@temporalio/client` in workflow files.                     |         |    error    |
| [`workflow-no-console`](documentation/rules/.md)                                        | Disallow `console.*` in workflow files. Use `log` from `@temporalio/workflow`. |   Yes   |    error    |
| [`workflow-no-continue-as-new-in-update-handler`](documentation/rules/.md)              | Disallow calling `continueAsNew` inside update handlers.                       |         |    error    |
| [`workflow-no-continue-as-new-without-state-argument`](documentation/rules/.md)         | Require `continueAsNew()` to pass workflow state arguments.                    |         |    warn     |
| [`workflow-no-crypto-random-uuid`](documentation/rules/.md)                             | Disallow `crypto.randomUUID()`. Use `uuid4()` from `@temporalio/workflow`.     |         |    error    |
| [`workflow-no-date-now-tight-loop`](documentation/rules/.md)                            | Warn on multiple `Date.now()` calls without yielding.                          |         |    warn     |
| [`workflow-no-date-object-in-payload`](documentation/rules/.md)                         | Disallow `Date` objects in workflow payloads.                                  |         |    warn     |
| [`workflow-no-duplicate-patch-ids`](documentation/rules/.md)                            | Disallow duplicate patch IDs in the same workflow.                             |         |    error    |
| [`workflow-no-dynamic-import`](documentation/rules/.md)                                 | Disallow dynamic `import()` expressions in workflows.                          |         |    error    |
| [`workflow-no-dynamic-require`](documentation/rules/.md)                                | Disallow dynamic `require()` calls in workflows.                               |         |    error    |
| [`workflow-no-error-as-payload`](documentation/rules/.md)                               | Disallow `Error` objects in workflow payload types.                            |         |    warn     |
| [`workflow-no-finalization-registry`](documentation/rules/.md)                          | Disallow `FinalizationRegistry` in workflows (non-deterministic).              |         |    error    |
| [`workflow-no-floating-promises`](documentation/rules/.md)                              | Disallow floating (unhandled) promises in workflows.                           |         |    error    |
| [`workflow-no-frequent-search-attribute-upserts`](documentation/rules/.md)              | Warn when `upsertSearchAttributes` is called inside loops.                     |         |    warn     |
| [`workflow-no-fs-in-workflow`](documentation/rules/.md)                                 | Disallow filesystem access in workflows. Use activities for file I/O.          |         |    error    |
| [`workflow-no-heavy-cpu-in-workflow`](documentation/rules/.md)                          | Warn on CPU-heavy work in workflows (move to activities).                      |         |    warn     |
| [`workflow-no-large-inline-constants`](documentation/rules/.md)                         | Warn about large inline literals in workflow code.                             |         |    warn     |
| [`workflow-no-large-literal-activity-payloads`](documentation/rules/.md)                | Warn about large literal payloads sent to activities.                          |         |    warn     |
| [`workflow-no-large-literal-payloads`](documentation/rules/.md)                         | Warn about large literal payloads sent to child workflows.                     |         |    warn     |
| [`workflow-no-logger-library-in-workflow`](documentation/rules/.md)                     | Disallow logger libraries in workflows. Use the workflow `log` instead.        |         |    error    |
| [`workflow-no-mixed-scope-exports`](documentation/rules/.md)                            | Disallow exporting Worker/Client/Activity values from workflow files.          |         |    error    |
| [`workflow-no-network-in-workflow`](documentation/rules/.md)                            | Disallow network access in workflows. Use activities for HTTP calls.           |         |    error    |
| [`workflow-no-node-or-dom-imports`](documentation/rules/.md)                            | Disallow Node.js built-in modules and DOM APIs.                                |         |    error    |
| [`workflow-no-nondeterministic-control-flow`](documentation/rules/.md)                  | Warn when control flow depends on time/randomness without annotation.          |         |    warn     |
| [`workflow-no-nonserializable-types-in-payloads`](documentation/rules/.md)              | Disallow non-serializable types in workflow payloads.                          |         |    warn     |
| [`workflow-no-process-env`](documentation/rules/.md)                                    | Disallow `process.env` access (non-deterministic).                             |         |    error    |
| [`workflow-no-query-mutation`](documentation/rules/.md)                                 | Disallow state mutations inside query handlers.                                |         |    error    |
| [`workflow-no-retry-for-nonidempotent-activities`](documentation/rules/.md)             | Require `retry.maximumAttempts: 1` for non-idempotent activities.              |         |    warn     |
| [`workflow-no-setinterval`](documentation/rules/.md)                                    | Disallow `setInterval` (use `sleep()` in a loop instead).                      |         |    error    |
| [`workflow-no-settimeout-in-cancellation-scope`](documentation/rules/.md)               | Disallow `setTimeout` inside `CancellationScope` callbacks.                    |         |    warn     |
| [`workflow-no-swallow-cancellation`](documentation/rules/.md)                           | Require cancellation errors to be rethrown.                                    |         |    warn     |
| [`workflow-no-throw-raw-error`](documentation/rules/.md)                                | Prefer throwing `ApplicationFailure` over raw `Error`.                         |         |    warn     |
| [`workflow-no-top-level-workflow-side-effects`](documentation/rules/.md)                | Disallow scheduling workflow commands at module scope.                         |         |    error    |
| [`workflow-no-unsafe-global-mutation`](documentation/rules/.md)                         | Disallow mutating global state in workflows.                                   |         |    error    |
| [`workflow-no-unsafe-package-imports`](documentation/rules/.md)                         | Disallow importing packages unsafe for workflow determinism.                   |         |    error    |
| [`workflow-no-uuid-library-in-workflow`](documentation/rules/.md)                       | Disallow UUID libraries in workflows. Use `uuid4()` instead.                   |         |    error    |
| [`workflow-no-wall-clock-assumptions`](documentation/rules/.md)                         | Warn when comparing `Date.now()` to external timestamps in workflows.          |         |    warn     |
| [`workflow-no-weakref`](documentation/rules/.md)                                        | Disallow `WeakRef` in workflows (non-deterministic).                           |         |    error    |
| [`workflow-no-worker-import`](documentation/rules/.md)                                  | Disallow importing `@temporalio/worker` in workflow files.                     |         |    error    |
| [`workflow-no-workflow-apis-in-query`](documentation/rules/.md)                         | Disallow workflow APIs (`sleep`, `condition`, etc.) in query handlers.         |         |    error    |
| [`workflow-no-workflow-prng-for-persisted-ids`](documentation/rules/.md)                | Warn when workflow PRNG values are used for persisted IDs or payloads.         |         |    warn     |
| [`workflow-non-cancellable-cleanup-required`](documentation/rules/.md)                  | Require `CancellationScope.nonCancellable` for cleanup on cancellation.        |         |    warn     |
| [`workflow-patch-id-literal`](documentation/rules/.md)                                  | Require patch IDs to be string literals.                                       |         |    warn     |
| [`workflow-patched-must-guard-incompatible-change`](documentation/rules/.md)            | Require `patched()` to guard incompatible workflow changes.                    |         |    warn     |
| [`workflow-prefer-cancellation-scope-with-timeout`](documentation/rules/.md)            | Prefer `CancellationScope.withTimeout()` over `Promise.race` timeouts.         |         |    warn     |
| [`workflow-prefer-condition-over-polling`](documentation/rules/.md)                     | Prefer `condition()` over polling loops with `sleep()`.                        |         |    warn     |
| [`workflow-prefer-local-activity-for-nondeterministic-value`](documentation/rules/.md)  | Suggest generating nondeterministic values in local activities.                |         |    warn     |
| [`workflow-prefer-single-object-args`](documentation/rules/.md)                         | Prefer a single object parameter for workflows.                                |         |    warn     |
| [`workflow-prefer-sleep`](documentation/rules/.md)                                      | Prefer `sleep()` over `setTimeout` in workflows.                               |         |    warn     |
| [`workflow-prefer-workflow-uuid`](documentation/rules/.md)                              | Prefer `uuid4()` from `@temporalio/workflow` over other UUID libs.             |   Yes   |    error    |
| [`workflow-replay-testing-required-comment`](documentation/rules/.md)                   | Require a replay-tested comment when changing versioning logic.                |   Yes   |    warn     |
| [`workflow-require-activity-retry-policy`](documentation/rules/.md)                     | Suggest configuring retry policies for activities.                             |         |    warn     |
| [`workflow-require-activity-timeouts`](documentation/rules/.md)                         | Require timeout configuration when calling `proxyActivities()`.                |         |    error    |
| [`workflow-require-all-handlers-finished`](documentation/rules/.md)                     | Suggest using `allHandlersFinished()` before workflow completion.              |         |    warn     |
| [`workflow-require-deprecate-patch-after-branch-removal`](documentation/rules/.md)      | Require `deprecatePatch()` after removing a patched fallback branch.           |         |    warn     |
| [`workflow-require-explicit-payload-types`](documentation/rules/.md)                    | Require explicit payload types for workflows and handlers.                     |         |    warn     |
| [`workflow-require-handler-serialization-safe-types`](documentation/rules/.md)          | Require handler args/returns to be payload-serializable.                       |         |    warn     |
| [`workflow-require-idempotency-key-arg`](documentation/rules/.md)                       | Require idempotency keys for non-idempotent activity calls.                    |         |    warn     |
| [`workflow-require-message-definitions-at-module-scope`](documentation/rules/.md)       | Require `defineSignal`/`defineQuery`/`defineUpdate` at module scope.           |         |    warn     |
| [`workflow-require-set-handler-early`](documentation/rules/.md)                         | Suggest registering signal/query handlers early in the workflow.               |         |    warn     |
| [`workflow-require-type-only-activity-imports`](documentation/rules/.md)                | Require type-only imports for activity type definitions.                       |         |    error    |
| [`workflow-search-attributes-upsert-shape`](documentation/rules/.md)                    | Require `upsertSearchAttributes` values to be arrays (use `[]` to remove).     |         |    warn     |
| [`workflow-signal-handler-returns-void`](documentation/rules/.md)                       | Require signal handlers to return `void`.                                      |         |    error    |
| [`workflow-sink-args-must-be-cloneable`](documentation/rules/.md)                       | Require sink call arguments to be cloneable data.                              |         |    warn     |
| [`workflow-sink-no-await`](documentation/rules/.md)                                     | Disallow awaiting sink calls (sinks are fire-and-forget).                      |         |    error    |
| [`workflow-sink-no-return-value`](documentation/rules/.md)                              | Disallow using return values from sink calls.                                  |         |    error    |
| [`workflow-update-handler-return-type`](documentation/rules/.md)                        | Suggest explicit return types for update handlers.                             |         |    warn     |
| [`workflow-uuid4-requires-security-comment`](documentation/rules/.md)                   | Require a comment noting `uuid4()` is deterministic and not secure.            |   Yes   |    warn     |

### Activity Rules

| Rule                                                            | Description                                                                          | Fixable | Recommended |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | :-----: | :---------: |
| [`activity-context-not-stored`](documentation/rules/.md)        | Disallow storing Activity Context in variables that persist across async boundaries. |         |    error    |
| [`activity-heartbeat-in-long-loops`](documentation/rules/.md)   | Suggest calling `heartbeat()` in loops that contain `await` expressions.             |         |    warn     |
| [`activity-prefer-activity-log`](documentation/rules/.md)       | Prefer `log` from `@temporalio/activity` over `console.*` for structured logging.    |   Yes   |    warn     |
| [`activity-prefer-applicationfailure`](documentation/rules/.md) | Prefer throwing `ApplicationFailure` over raw `Error` in activities.                 |         |    warn     |
| [`activity-prefer-single-object-args`](documentation/rules/.md) | Prefer a single object parameter for activities.                                     |         |    warn     |
| [`activity-use-cancellation-signal`](documentation/rules/.md)   | Suggest passing cancellation signal to HTTP clients in activities.                   |         |    warn     |

### Worker Rules

| Rule                                                                    | Description                                                                     | Fixable | Recommended |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- | :-----: | :---------: |
| [`worker-ignoremodules-requires-comment`](documentation/rules/.md)      | Require a comment explaining why modules are being ignored in `bundlerOptions`. |   Yes   |    warn     |
| [`worker-no-workflow-or-activity-definitions`](documentation/rules/.md) | Disallow importing workflow or activity definitions directly in worker files.   |         |    error    |
| [`worker-require-call-during-replay-explicit`](documentation/rules/.md) | Require explicit `callDuringReplay` on sink definitions.                        |         |    warn     |

### Client Rules

| Rule                                                    | Description                                                                  | Fixable | Recommended |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- | :-----: | :---------: |
| [`client-require-workflow-id`](documentation/rules/.md) | Require explicit `workflowId` when starting workflows to ensure idempotency. |         |    warn     |

### Test Rules

| Rule                                                         | Description                                                                                   | Fixable | Recommended |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | :-----: | :---------: |
| [`replay-history-smoke-test-hook`](documentation/rules/.md)  | Require a replay history smoke test hook exporting a function calling `runReplayHistories()`. |         |    warn     |
| [`test-import-type-for-activities`](documentation/rules/.md) | Require type-only imports for activity modules in tests.                                      |         |    warn     |
| [`test-teardown-required`](documentation/rules/.md)          | Require `TestWorkflowEnvironment.teardown()` in `afterAll`/`afterEach`.                       |         |    warn     |
| [`test-worker-run-until-required`](documentation/rules/.md)  | Require `worker.runUntil(...)` when creating Workers in tests.                                |         |    warn     |

### Shared Rules

| Rule                                                               | Description                                                          | Fixable | Recommended |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- | :-----: | :---------: |
| [`no-temporal-internal-imports`](documentation/rules/.md)          | Disallow importing from internal Temporal SDK paths.                 |   Yes   |    error    |
| [`no-workflow-and-activity-in-same-file`](documentation/rules/.md) | Disallow mixing workflow and activity code in the same file.         |         |    error    |
| [`task-queue-constant`](documentation/rules/.md)                   | Suggest using a constant for task queue names to ensure consistency. |         |    warn     |

## License

ISC
