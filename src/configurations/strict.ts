import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Strict config - all rules as errors
 */
export const strictRules: TSESLint.FlatConfig.Rules = {
  // Shared rules
  'temporal/task-queue-constant': 'error',
  'temporal/no-temporal-internal-imports': 'error',

  // Workflow rules
  'temporal/workflow-condition-timeout-style': 'error',
  'temporal/workflow-no-activity-definitions-import': 'error',
  'temporal/workflow-duration-format': 'error',
  'temporal/workflow-activity-timeout-duration-format': 'error',
  'temporal/workflow-require-message-definitions-at-module-scope': 'error',
  'temporal/workflow-patched-must-guard-incompatible-change': 'error',
  'temporal/workflow-require-deprecatePatch-after-branch-removal': 'error',
  'temporal/workflow-replay-testing-required-comment': 'error',
  'temporal/workflow-prefer-CancellationScope-withTimeout': 'error',
  'temporal/workflow-no-settimeout-in-cancellation-scope': 'error',
  'temporal/workflow-no-swallow-cancellation': 'error',
  'temporal/workflow-nonCancellable-cleanup-required': 'error',
  'temporal/workflow-await-cancelRequested-in-nonCancellable-pattern': 'error',
  'temporal/workflow-no-await-in-handler-without-exit-guard': 'error',
  'temporal/workflow-no-fs-in-workflow': 'error',
  'temporal/workflow-no-node-or-dom-imports': 'error',
  'temporal/workflow-no-network-in-workflow': 'error',
  'temporal/workflow-no-logger-library-in-workflow': 'error',
  'temporal/workflow-no-uuid-library-in-workflow': 'error',
  'temporal/workflow-no-mixed-scope-exports': 'error',
  'temporal/workflow-no-top-level-workflow-side-effects': 'error',
  'temporal/workflow-no-unsafe-package-imports': 'error',
  'temporal/workflow-no-nondeterministic-control-flow': 'error',
  'temporal/workflow-no-date-now-tight-loop': 'error',
  'temporal/workflow-no-wall-clock-assumptions': 'error',
  'temporal/workflow-uuid4-requires-security-comment': 'error',
  'temporal/workflow-no-heavy-cpu-in-workflow': 'error',
  'temporal/workflow-no-large-literal-activity-payloads': 'error',
  'temporal/workflow-no-large-literal-payloads': 'error',
  'temporal/workflow-no-console': 'error',
  'temporal/workflow-no-continueAsNew-without-state-argument': 'error',
  'temporal/workflow-require-activity-timeouts': 'error',
  'temporal/workflow-no-retry-for-nonidempotent-activities': 'error',
  'temporal/workflow-require-idempotency-key-arg': 'error',
  'temporal/workflow-prefer-single-object-args': 'error',
  'temporal/workflow-require-handler-serialization-safe-types': 'error',
  'temporal/workflow-prefer-workflow-uuid': 'error',
  'temporal/workflow-no-floating-promises': 'error',
  'temporal/workflow-no-throw-raw-error': 'error',
  'temporal/workflow-patch-id-literal': 'error',

  // Activity rules
  'temporal/activity-prefer-activity-log': 'error',
  'temporal/activity-prefer-applicationfailure': 'error',
  'temporal/activity-prefer-single-object-args': 'error',
  'temporal/activity-heartbeat-in-long-loops': 'error',
  'temporal/activity-use-cancellation-signal': 'error',
  'temporal/activity-context-not-stored': 'error',

  // Worker rules
  'temporal/worker-no-workflow-or-activity-definitions': 'error',
  'temporal/worker-ignoremodules-requires-comment': 'error',

  // Client rules
  'temporal/client-require-workflow-id': 'error',
};
