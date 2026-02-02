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
  'temporal/workflow-no-console': 'error',
  'temporal/workflow-require-activity-timeouts': 'error',
  'temporal/workflow-prefer-workflow-uuid': 'error',
  'temporal/workflow-no-floating-promises': 'error',
  'temporal/workflow-no-throw-raw-error': 'error',
  'temporal/workflow-patch-id-literal': 'error',

  // Activity rules
  'temporal/activity-prefer-activity-log': 'error',
  'temporal/activity-prefer-applicationfailure': 'error',
  'temporal/activity-heartbeat-in-long-loops': 'error',
  'temporal/activity-use-cancellation-signal': 'error',
  'temporal/activity-context-not-stored': 'error',

  // Worker rules
  'temporal/worker-no-workflow-or-activity-definitions': 'error',
  'temporal/worker-ignoremodules-requires-comment': 'error',

  // Client rules
  'temporal/client-require-workflow-id': 'error',
};
