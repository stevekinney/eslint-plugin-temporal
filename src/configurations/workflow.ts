import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Workflow config - strict determinism rules for workflow files
 */
export const workflowRules: TSESLint.FlatConfig.Rules = {
  'temporal/workflow-no-activity-definitions-import': 'error',
  'temporal/workflow-no-fs-in-workflow': 'error',
  'temporal/workflow-no-node-or-dom-imports': 'error',
  'temporal/workflow-no-network-in-workflow': 'error',
  'temporal/workflow-no-logger-library-in-workflow': 'error',
  'temporal/workflow-no-uuid-library-in-workflow': 'error',
  'temporal/workflow-no-mixed-scope-exports': 'error',
  'temporal/workflow-no-top-level-workflow-side-effects': 'error',
  'temporal/workflow-no-unsafe-package-imports': 'error',
  'temporal/workflow-no-nondeterministic-control-flow': 'warn',
  'temporal/workflow-uuid4-requires-security-comment': 'warn',
  'temporal/workflow-no-heavy-cpu-in-workflow': 'warn',
  'temporal/workflow-no-console': 'error',
  'temporal/workflow-require-activity-timeouts': 'error',
  'temporal/workflow-prefer-workflow-uuid': 'error',
  'temporal/workflow-no-floating-promises': 'error',
  'temporal/workflow-no-throw-raw-error': 'warn',
  'temporal/workflow-patch-id-literal': 'warn',
};
