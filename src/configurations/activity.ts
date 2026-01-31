import type { TSESLint } from '@typescript-eslint/utils';

/**
 * Activity config - retry safety and best practices for activities
 */
export const activityRules: TSESLint.FlatConfig.Rules = {
  'temporal/activity-prefer-activity-log': 'warn',
  'temporal/activity-prefer-applicationfailure': 'warn',
  'temporal/activity-heartbeat-in-long-loops': 'warn',
  'temporal/activity-use-cancellation-signal': 'warn',
  'temporal/activity-context-not-stored': 'error',
};
