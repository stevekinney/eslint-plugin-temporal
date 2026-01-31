# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-01-30

Initial release of eslint-plugin-temporal.

### Added

**Workflow Rules (9)**

- `workflow-no-activity-definitions-import` - Prevent importing activity implementations in workflow files
- `workflow-no-node-or-dom-imports` - Prevent Node.js built-ins and DOM APIs in workflows
- `workflow-no-unsafe-package-imports` - Prevent non-deterministic package imports
- `workflow-require-activity-timeouts` - Require timeout configuration for proxyActivities()
- `workflow-no-console` - Prevent console.\* usage (with autofix)
- `workflow-prefer-workflow-uuid` - Prefer deterministic uuid4() (with autofix)
- `workflow-no-floating-promises` - Prevent unhandled promises in workflows
- `workflow-no-throw-raw-error` - Prefer ApplicationFailure over raw Error
- `workflow-patch-id-literal` - Require string literal patch IDs

**Activity Rules (5)**

- `activity-prefer-activity-log` - Prefer structured logging (with autofix)
- `activity-prefer-applicationfailure` - Prefer ApplicationFailure over raw Error
- `activity-heartbeat-in-long-loops` - Suggest heartbeat() in async loops
- `activity-use-cancellation-signal` - Suggest passing cancellation signals to HTTP clients
- `activity-context-not-stored` - Prevent storing Activity Context across async boundaries

**Worker Rules (2)**

- `worker-no-workflow-or-activity-definitions` - Prevent importing definitions in worker files
- `worker-ignoremodules-requires-comment` - Require comments for ignored modules

**Client Rules (1)**

- `client-require-workflow-id` - Require explicit workflowId for idempotency

**Shared Rules (2)**

- `task-queue-constant` - Suggest constants for task queue names
- `no-temporal-internal-imports` - Prevent internal SDK path imports

**Configurations (6)**

- `recommended` - Safe rules for all Temporal projects
- `workflow` - Strict determinism rules for workflow files
- `activity` - Retry safety rules for activity files
- `worker` - Clean bootstrap rules for worker files
- `client` - Rules for client code
- `strict` - All rules enabled as errors

### Notes

- Requires ESLint 9.0.0+ (flat config only)
- Requires TypeScript 5.0.0+
