import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Client config - rules for Temporal client code
 */
export const clientRules: TSESLint.FlatConfig.Rules = {
  'temporal/client-require-workflow-id': 'warn',
  'temporal/task-queue-constant': 'warn',
};
