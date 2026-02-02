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

### Workflow Rules

| Rule                                                   | Description                                                                 | Fixable |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | :-----: |
| `workflow-condition-timeout-style`                     | Enforce consistent timeout style for condition() calls.                     |         |
| `workflow-deprecate-patch-requires-comment`            | Require a comment explaining why deprecatePatch is being used.              |         |
| `workflow-duration-format`                             | Enforce consistent duration literal format (string vs ms number).           |         |
| `workflow-activity-timeout-duration-format`            | Enforce consistent duration literal format for activity timeouts.           |         |
| `workflow-message-name-literal`                        | Require signal/query/update names to be string literals.                    |         |
| `workflow-require-message-definitions-at-module-scope` | Require defineSignal/defineQuery/defineUpdate at module scope.              |         |
| `workflow-no-activity-definitions-import`              | Disallow importing activity implementations. Use proxyActivities() instead. |         |
| `workflow-no-async-query-handler`                      | Disallow async query handlers (queries must be synchronous).                |         |
| `workflow-no-busy-wait`                                | Disallow busy-wait loops. Use sleep() or condition() instead.               |         |
| `workflow-no-client-import`                            | Disallow importing @temporalio/client in workflow files.                    |         |
| `workflow-no-console`                                  | Disallow console.\* in workflow files. Use log from @temporalio/workflow.   |   Yes   |
| `workflow-no-continueAsNew-in-update-handler`          | Disallow calling continueAsNew inside update handlers.                      |         |
| `workflow-no-crypto-random-uuid`                       | Disallow crypto.randomUUID(). Use uuid4() from @temporalio/workflow.        |         |
| `workflow-no-date-now-tight-loop`                      | Warn on multiple Date.now() calls without yielding.                         |         |
| `workflow-no-duplicate-patch-ids`                      | Disallow duplicate patch IDs in the same workflow.                          |         |
| `workflow-no-dynamic-import`                           | Disallow dynamic import() expressions in workflows.                         |         |
| `workflow-no-dynamic-require`                          | Disallow dynamic require() calls in workflows.                              |         |
| `workflow-no-fs-in-workflow`                           | Disallow filesystem access in workflows. Use activities for file I/O.       |         |
| `workflow-no-finalization-registry`                    | Disallow FinalizationRegistry in workflows (non-deterministic).             |         |
| `workflow-no-floating-promises`                        | Disallow floating (unhandled) promises in workflows.                        |         |
| `workflow-no-heavy-cpu-in-workflow`                    | Warn on CPU-heavy work in workflows (move to activities).                   |         |
| `workflow-no-large-literal-activity-payloads`          | Warn about large literal payloads sent to activities.                       |         |
| `workflow-no-large-literal-payloads`                   | Warn about large literal payloads sent to child workflows.                  |         |
| `workflow-no-logger-library-in-workflow`               | Disallow logger libraries in workflows. Use the workflow log instead.       |         |
| `workflow-no-mixed-scope-exports`                      | Disallow exporting Worker/Client/Activity values from workflow files.       |         |
| `workflow-no-network-in-workflow`                      | Disallow network access in workflows. Use activities for HTTP calls.        |         |
| `workflow-no-node-or-dom-imports`                      | Disallow Node.js built-in modules and DOM APIs.                             |         |
| `workflow-no-nondeterministic-control-flow`            | Warn when control flow depends on time/randomness without annotation.       |         |
| `workflow-no-process-env`                              | Disallow process.env access (non-deterministic).                            |         |
| `workflow-no-query-mutation`                           | Disallow state mutations inside query handlers.                             |         |
| `workflow-no-retry-for-nonidempotent-activities`       | Require retry.maximumAttempts: 1 for non-idempotent activities.             |         |
| `workflow-no-setinterval`                              | Disallow setInterval (use sleep() in a loop instead).                       |         |
| `workflow-no-top-level-workflow-side-effects`          | Disallow scheduling workflow commands at module scope.                      |         |
| `workflow-no-throw-raw-error`                          | Prefer throwing ApplicationFailure over raw Error.                          |         |
| `workflow-no-unsafe-global-mutation`                   | Disallow mutating global state in workflows.                                |         |
| `workflow-no-unsafe-package-imports`                   | Disallow importing packages unsafe for workflow determinism.                |         |
| `workflow-no-uuid-library-in-workflow`                 | Disallow UUID libraries in workflows. Use uuid4() instead.                  |         |
| `workflow-no-wall-clock-assumptions`                   | Warn when comparing Date.now() to external timestamps in workflows.         |         |
| `workflow-no-weakref`                                  | Disallow WeakRef in workflows (non-deterministic).                          |         |
| `workflow-no-worker-import`                            | Disallow importing @temporalio/worker in workflow files.                    |         |
| `workflow-no-workflow-apis-in-query`                   | Disallow workflow APIs (sleep, condition, etc.) in query handlers.          |         |
| `workflow-patch-id-literal`                            | Require patch IDs to be string literals.                                    |         |
| `workflow-prefer-condition-over-polling`               | Prefer condition() over polling loops with sleep().                         |         |
| `workflow-prefer-single-object-args`                   | Prefer a single object parameter for workflows.                             |         |
| `workflow-prefer-sleep`                                | Prefer sleep() over setTimeout in workflows.                                |         |
| `workflow-prefer-workflow-uuid`                        | Prefer uuid4() from @temporalio/workflow over other UUID libs.              |   Yes   |
| `workflow-require-idempotency-key-arg`                 | Require idempotency keys for non-idempotent activity calls.                 |         |
| `workflow-require-activity-retry-policy`               | Suggest configuring retry policies for activities.                          |         |
| `workflow-require-activity-timeouts`                   | Require timeout configuration when calling proxyActivities().               |         |
| `workflow-require-all-handlers-finished`               | Suggest using allHandlersFinished() before workflow completion.             |         |
| `workflow-no-await-in-handler-without-exit-guard`      | Require allHandlersFinished() when handlers await work.                     |         |
| `workflow-require-handler-serialization-safe-types`    | Require handler args/returns to be payload-serializable.                    |         |
| `workflow-require-setHandler-early`                    | Suggest registering signal/query handlers early in the workflow.            |         |
| `workflow-require-type-only-activity-imports`          | Require type-only imports for activity type definitions.                    |         |
| `workflow-signal-handler-returns-void`                 | Require signal handlers to return void.                                     |         |
| `workflow-sink-no-await`                               | Disallow awaiting sink calls (sinks are fire-and-forget).                   |         |
| `workflow-sink-no-return-value`                        | Disallow using return values from sink calls.                               |         |
| `workflow-update-handler-return-type`                  | Suggest explicit return types for update handlers.                          |         |
| `workflow-uuid4-requires-security-comment`             | Require a comment noting uuid4() is deterministic and not secure.           |         |

### Activity Rules

| Rule                                 | Description                                                                          | Fixable |
| ------------------------------------ | ------------------------------------------------------------------------------------ | :-----: |
| `activity-prefer-activity-log`       | Prefer log from @temporalio/activity over console.\* for structured logging.         |   Yes   |
| `activity-prefer-applicationfailure` | Prefer throwing ApplicationFailure over raw Error in activities.                     |         |
| `activity-prefer-single-object-args` | Prefer a single object parameter for activities.                                     |         |
| `activity-heartbeat-in-long-loops`   | Suggest calling heartbeat() in loops that contain await expressions.                 |         |
| `activity-use-cancellation-signal`   | Suggest passing cancellation signal to HTTP clients in activities.                   |         |
| `activity-context-not-stored`        | Disallow storing Activity Context in variables that persist across async boundaries. |         |

### Worker Rules

| Rule                                         | Description                                                                   | Fixable |
| -------------------------------------------- | ----------------------------------------------------------------------------- | :-----: |
| `worker-no-workflow-or-activity-definitions` | Disallow importing workflow or activity definitions directly in worker files. |         |
| `worker-ignoremodules-requires-comment`      | Require a comment explaining why modules are being ignored in bundlerOptions. |         |

### Client Rules

| Rule                         | Description                                                                | Fixable |
| ---------------------------- | -------------------------------------------------------------------------- | :-----: |
| `client-require-workflow-id` | Require explicit workflowId when starting workflows to ensure idempotency. |         |

### Shared Rules

| Rule                                    | Description                                                          | Fixable |
| --------------------------------------- | -------------------------------------------------------------------- | :-----: |
| `task-queue-constant`                   | Suggest using a constant for task queue names to ensure consistency. |         |
| `no-temporal-internal-imports`          | Disallow importing from internal Temporal SDK paths.                 |   Yes   |
| `no-workflow-and-activity-in-same-file` | Disallow mixing workflow and activity code in the same file.         |         |

## License

ISC
