import type { TSESLint } from '@typescript-eslint/utils';

import packageJson from '../package.json' assert { type: 'json' };
import {
  activityRules,
  clientRules,
  recommendedRules,
  strictRules,
  workerRules,
  workflowRules,
} from './configurations/index.ts';
import { rules } from './rules/index.ts';

// Read version from package.json at build time
const version = packageJson.version;

/**
 * ESLint plugin for the Temporal TypeScript SDK.
 *
 * Provides rules to enforce best practices and prevent common mistakes
 * across the four Temporal execution environments: Workflows, Activities,
 * Workers, and Clients.
 */
const plugin = {
  meta: {
    name: 'eslint-plugin-temporal',
    version,
    namespace: 'temporal',
  },
  rules,
  configs: {} as Record<string, TSESLint.FlatConfig.Config>,
};

// Self-reference pattern for flat config compatibility
// This allows users to do: temporal.configs.recommended
const pluginRef = { temporal: plugin };

plugin.configs = {
  /**
   * Recommended config - rules safe to use everywhere
   * Use for general Temporal projects
   */
  recommended: {
    name: 'temporal/recommended',
    plugins: pluginRef,
    rules: recommendedRules,
  },

  /**
   * Workflow config - strict determinism rules
   * Use for workflow files (e.g., src/workflows/**)
   */
  workflow: {
    name: 'temporal/workflow',
    plugins: pluginRef,
    rules: workflowRules,
  },

  /**
   * Activity config - retry safety rules
   * Use for activity files (e.g., src/activities/**)
   */
  activity: {
    name: 'temporal/activity',
    plugins: pluginRef,
    rules: activityRules,
  },

  /**
   * Worker config - clean bootstrap rules
   * Use for worker files (e.g., src/worker/**)
   */
  worker: {
    name: 'temporal/worker',
    plugins: pluginRef,
    rules: workerRules,
  },

  /**
   * Client config - rules for client code
   * Use for client files (e.g., src/client/**)
   */
  client: {
    name: 'temporal/client',
    plugins: pluginRef,
    rules: clientRules,
  },

  /**
   * Strict config - all rules as errors
   * Use for strict enforcement
   */
  strict: {
    name: 'temporal/strict',
    plugins: pluginRef,
    rules: strictRules,
  },
};

export default plugin;

// Named exports for convenience
export { rules };
export type { RuleKey } from './rules/index.ts';
