import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Workflow config - strict determinism rules for workflow files
 */
export const workflowRules: TSESLint.FlatConfig.Rules = {
  'temporal/workflow-no-activity-definitions-import': 'error',
  'temporal/workflow-no-node-or-dom-imports': 'error',
  'temporal/workflow-no-unsafe-package-imports': 'error',
  'temporal/workflow-no-console': 'error',
  'temporal/workflow-require-activity-timeouts': 'error',
  'temporal/workflow-prefer-workflow-uuid': 'error',
  'temporal/workflow-no-floating-promises': 'error',
  'temporal/workflow-no-throw-raw-error': 'warn',
  'temporal/workflow-patch-id-literal': 'warn',
};
