import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Recommended config - rules that are safe to use everywhere
 */
export const recommendedRules: TSESLint.FlatConfig.Rules = {
  'temporal/task-queue-constant': 'warn',
  'temporal/no-temporal-internal-imports': 'error',
  'temporal/client-require-workflow-id': 'warn',
};
