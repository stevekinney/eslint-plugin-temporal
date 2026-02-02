import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Worker config - clean bootstrap rules for worker files
 */
export const workerRules: TSESLint.FlatConfig.Rules = {
  'temporal/worker-no-workflow-or-activity-definitions': 'error',
  'temporal/worker-ignoremodules-requires-comment': 'warn',
  'temporal/worker-require-call-during-replay-explicit': 'warn',
};
