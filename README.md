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

export default [
  // Apply recommended rules to all files
  temporal.configs.recommended,

  // Apply workflow rules to workflow files
  {
    files: ['src/workflows/**/*.ts'],
    ...temporal.configs.workflow,
  },

  // Apply activity rules to activity files
  {
    files: ['src/activities/**/*.ts'],
    ...temporal.configs.activity,
  },

  // Apply worker rules to worker files
  {
    files: ['src/worker/**/*.ts'],
    ...temporal.configs.worker,
  },

  // Apply client rules to client files
  {
    files: ['src/client/**/*.ts'],
    ...temporal.configs.client,
  },
];
```

## Configurations

| Configuration | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| `recommended` | Rules safe to use everywhere. Start here for general Temporal projects. |
| `workflow`    | Strict determinism rules for workflow files.                            |
| `activity`    | Retry safety and best practice rules for activity files.                |
| `worker`      | Clean bootstrap rules for worker files.                                 |
| `client`      | Rules for client code that starts and signals workflows.                |
| `strict`      | All rules enabled as errors. For maximum enforcement.                   |

## Rules

### Workflow Rules

| Rule                                      | Description                                                                                   | Fixable |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- | :-----: |
| `workflow-no-activity-definitions-import` | Disallow importing activity implementations in workflow files. Use proxyActivities() instead. |         |
| `workflow-no-node-or-dom-imports`         | Disallow Node.js built-in modules and DOM APIs in workflow files.                             |         |
| `workflow-no-unsafe-package-imports`      | Disallow importing packages that are unsafe for workflow determinism.                         |         |
| `workflow-require-activity-timeouts`      | Require timeout configuration when calling proxyActivities().                                 |         |
| `workflow-no-console`                     | Disallow console.\* in workflow files. Use log from @temporalio/workflow instead.             |   Yes   |
| `workflow-prefer-workflow-uuid`           | Prefer uuid4() from @temporalio/workflow over other UUID libraries.                           |   Yes   |
| `workflow-no-floating-promises`           | Disallow floating (unhandled) promises in workflows.                                          |         |
| `workflow-no-throw-raw-error`             | Prefer throwing ApplicationFailure over raw Error in workflows.                               |         |
| `workflow-patch-id-literal`               | Require patch IDs to be string literals for traceability and determinism.                     |         |

### Activity Rules

| Rule                                 | Description                                                                          | Fixable |
| ------------------------------------ | ------------------------------------------------------------------------------------ | :-----: |
| `activity-prefer-activity-log`       | Prefer log from @temporalio/activity over console.\* for structured logging.         |   Yes   |
| `activity-prefer-applicationfailure` | Prefer throwing ApplicationFailure over raw Error in activities.                     |         |
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

| Rule                           | Description                                                          | Fixable |
| ------------------------------ | -------------------------------------------------------------------- | :-----: |
| `task-queue-constant`          | Suggest using a constant for task queue names to ensure consistency. |         |
| `no-temporal-internal-imports` | Disallow importing from internal Temporal SDK paths.                 |   Yes   |

## License

ISC
