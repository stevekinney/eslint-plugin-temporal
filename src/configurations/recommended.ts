import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Recommended config - enables all rules with auto-detection.
 *
 * This configuration uses import-based and file-path detection to automatically
 * determine which rules should apply to each file. Rules will only fire in their
 * appropriate context (e.g., workflow rules only in workflow files).
 *
 * Detection priority:
 * 1. Imports (most reliable): @temporalio/workflow → workflow context
 * 2. File patterns (fallback): ** /workflows/** → workflow context
 * 3. Unknown: Apply only shared/universal rules
 *
 * Usage:
 * ```javascript
 * import temporal from 'eslint-plugin-temporal';
 *
 * export default [
 *   temporal.configs.recommended,  // Just works! Auto-detects context
 * ];
 * ```
 */
export const recommendedRules: TSESLint.FlatConfig.Rules = {
  // Shared rules (always apply)
  'temporal/task-queue-constant': 'warn',
  'temporal/no-temporal-internal-imports': 'error',
  'temporal/no-workflow-and-activity-in-same-file': 'error',

  // Workflow rules (auto-detected via @temporalio/workflow imports or file paths)
  'temporal/workflow-condition-timeout-style': 'warn',
  'temporal/workflow-deprecate-patch-requires-comment': 'warn',
  'temporal/workflow-patched-must-guard-incompatible-change': 'warn',
  'temporal/workflow-require-deprecatePatch-after-branch-removal': 'warn',
  'temporal/workflow-replay-testing-required-comment': 'warn',
  'temporal/workflow-duration-format': 'warn',
  'temporal/workflow-activity-timeout-duration-format': 'warn',
  'temporal/workflow-message-name-literal': 'warn',
  'temporal/workflow-require-message-definitions-at-module-scope': 'warn',
  'temporal/workflow-prefer-CancellationScope-withTimeout': 'warn',
  'temporal/workflow-no-settimeout-in-cancellation-scope': 'warn',
  'temporal/workflow-no-swallow-cancellation': 'warn',
  'temporal/workflow-nonCancellable-cleanup-required': 'warn',
  'temporal/workflow-await-cancelRequested-in-nonCancellable-pattern': 'warn',
  'temporal/workflow-no-await-in-handler-without-exit-guard': 'warn',
  'temporal/workflow-no-activity-definitions-import': 'error',
  'temporal/workflow-no-async-query-handler': 'error',
  'temporal/workflow-no-busy-wait': 'error',
  'temporal/workflow-no-client-import': 'error',
  'temporal/workflow-no-console': 'error',
  'temporal/workflow-no-continueAsNew-in-update-handler': 'error',
  'temporal/workflow-no-continueAsNew-without-state-argument': 'warn',
  'temporal/workflow-no-crypto-random-uuid': 'error',
  'temporal/workflow-no-date-now-tight-loop': 'warn',
  'temporal/workflow-no-duplicate-patch-ids': 'error',
  'temporal/workflow-no-dynamic-import': 'error',
  'temporal/workflow-no-dynamic-require': 'error',
  'temporal/workflow-no-fs-in-workflow': 'error',
  'temporal/workflow-no-finalization-registry': 'error',
  'temporal/workflow-no-floating-promises': 'error',
  'temporal/workflow-no-heavy-cpu-in-workflow': 'warn',
  'temporal/workflow-no-large-literal-activity-payloads': 'warn',
  'temporal/workflow-no-large-literal-payloads': 'warn',
  'temporal/workflow-no-large-inline-constants': 'warn',
  'temporal/workflow-no-nonserializable-types-in-payloads': 'warn',
  'temporal/workflow-no-error-as-payload': 'warn',
  'temporal/workflow-no-bigint-in-payload': 'warn',
  'temporal/workflow-no-date-object-in-payload': 'warn',
  'temporal/workflow-require-explicit-payload-types': 'warn',
  'temporal/workflow-no-any-in-workflow-public-api': 'warn',
  'temporal/workflow-no-logger-library-in-workflow': 'error',
  'temporal/workflow-no-mixed-scope-exports': 'error',
  'temporal/workflow-no-network-in-workflow': 'error',
  'temporal/workflow-no-node-or-dom-imports': 'error',
  'temporal/workflow-no-nondeterministic-control-flow': 'warn',
  'temporal/workflow-no-process-env': 'error',
  'temporal/workflow-no-query-mutation': 'error',
  'temporal/workflow-no-retry-for-nonidempotent-activities': 'warn',
  'temporal/workflow-no-setinterval': 'error',
  'temporal/workflow-no-top-level-workflow-side-effects': 'error',
  'temporal/workflow-no-throw-raw-error': 'warn',
  'temporal/workflow-no-unsafe-global-mutation': 'error',
  'temporal/workflow-no-unsafe-package-imports': 'error',
  'temporal/workflow-no-uuid-library-in-workflow': 'error',
  'temporal/workflow-no-wall-clock-assumptions': 'warn',
  'temporal/workflow-no-weakref': 'error',
  'temporal/workflow-no-worker-import': 'error',
  'temporal/workflow-no-workflow-apis-in-query': 'error',
  'temporal/workflow-patch-id-literal': 'warn',
  'temporal/workflow-prefer-condition-over-polling': 'warn',
  'temporal/workflow-prefer-sleep': 'warn',
  'temporal/workflow-prefer-single-object-args': 'warn',
  'temporal/workflow-prefer-workflow-uuid': 'error',
  'temporal/workflow-require-idempotency-key-arg': 'warn',
  'temporal/workflow-require-activity-retry-policy': 'warn',
  'temporal/workflow-require-activity-timeouts': 'error',
  'temporal/workflow-require-all-handlers-finished': 'warn',
  'temporal/workflow-require-handler-serialization-safe-types': 'warn',
  'temporal/workflow-require-setHandler-early': 'warn',
  'temporal/workflow-require-type-only-activity-imports': 'error',
  'temporal/workflow-signal-handler-returns-void': 'error',
  'temporal/workflow-sink-no-await': 'error',
  'temporal/workflow-sink-no-return-value': 'error',
  'temporal/workflow-update-handler-return-type': 'warn',
  'temporal/workflow-uuid4-requires-security-comment': 'warn',

  // Activity rules (auto-detected via @temporalio/activity imports or file paths)
  'temporal/activity-prefer-activity-log': 'warn',
  'temporal/activity-prefer-applicationfailure': 'warn',
  'temporal/activity-prefer-single-object-args': 'warn',
  'temporal/activity-heartbeat-in-long-loops': 'warn',
  'temporal/activity-use-cancellation-signal': 'warn',
  'temporal/activity-context-not-stored': 'error',

  // Worker rules (auto-detected via @temporalio/worker imports or file paths)
  'temporal/worker-no-workflow-or-activity-definitions': 'error',
  'temporal/worker-ignoremodules-requires-comment': 'warn',

  // Client rules (auto-detected via @temporalio/client imports or file paths)
  'temporal/client-require-workflow-id': 'warn',
};
