import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { ESLintUtils } from '@typescript-eslint/utils';

import type { TemporalFileType, TemporalPluginSettings } from '../types.ts';
import { ImportTracker } from './import-tracker.ts';
import { detectContext, isContextMatch } from './temporal-context.ts';

const DOCS_BASE_URL =
  'https://github.com/temporalio/eslint-plugin-temporal/blob/main/docs/rules';

/**
 * Options for context-aware rules
 */
interface ContextRuleOptions {
  /**
   * When true, test files will also have workflow rules applied.
   * This is useful for testing workflow code.
   * Default: true
   */
  treatTestAsWorkflow?: boolean;
}

/**
 * Extended rule module with context-aware wrapping
 */
type RuleListener = TSESLint.RuleListener;

/**
 * Creates an ESLint rule that only runs in a specific Temporal context.
 *
 * The rule will automatically detect the context from imports and file path,
 * and skip execution if the context doesn't match.
 *
 * @param expectedContext - The Temporal context this rule applies to
 * @param ruleDefinition - The rule definition
 * @param options - Additional options for context matching
 * @returns A wrapped rule that checks context before executing
 */
export function createContextRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(
  expectedContext: TemporalFileType,
  ruleDefinition: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
  options?: ContextRuleOptions,
): TSESLint.RuleModule<TMessageIds, TOptions> {
  const createRuleBase = ESLintUtils.RuleCreator((name) => `${DOCS_BASE_URL}/${name}.md`);

  return createRuleBase<TOptions, TMessageIds>({
    ...ruleDefinition,
    create(context, ruleOptions) {
      const tracker = new ImportTracker();
      const originalCreate = ruleDefinition.create;
      const treatTestAsWorkflow = options?.treatTestAsWorkflow ?? true;

      // Get the original listeners
      const originalListeners = originalCreate(context, ruleOptions);

      // Track if we've determined the context
      let contextDetermined = false;
      let shouldRun = false;

      // Check context and update shouldRun flag
      function checkContext(): void {
        if (contextDetermined) return;

        const filename = context.filename;
        const settings = context.settings?.['temporal'] as
          | TemporalPluginSettings
          | undefined;
        const result = detectContext(tracker, filename, settings);

        shouldRun = isContextMatch(result.context, expectedContext, {
          treatTestAsWorkflow,
        });
        contextDetermined = true;
      }

      // Wrap each listener to check context before executing
      const wrappedListeners: RuleListener = {};

      // Always track imports
      const originalImportDeclaration = originalListeners.ImportDeclaration;
      wrappedListeners.ImportDeclaration = function (node: TSESTree.ImportDeclaration) {
        tracker.addImport(node);
        // Call original if it exists
        if (typeof originalImportDeclaration === 'function') {
          // Check context after tracking this import
          checkContext();
          if (shouldRun) {
            originalImportDeclaration(node);
          }
        }
      };

      // Wrap all other listeners
      for (const [selector, listener] of Object.entries(originalListeners)) {
        if (selector === 'ImportDeclaration') continue;

        if (typeof listener === 'function') {
          wrappedListeners[selector] = function (...args: unknown[]) {
            checkContext();
            if (shouldRun) {
              (listener as (...args: unknown[]) => void)(...args);
            }
          };
        }
      }

      return wrappedListeners;
    },
  });
}

/**
 * Create a workflow-specific rule that only runs in workflow context.
 *
 * @example
 * ```typescript
 * export const noProcessEnv = createWorkflowRule({
 *   name: 'no-process-env',
 *   meta: { ... },
 *   defaultOptions: [],
 *   create(context) {
 *     return {
 *       MemberExpression(node) { ... }
 *     };
 *   }
 * });
 * ```
 */
export function createWorkflowRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(
  ruleDefinition: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
  options?: ContextRuleOptions,
): TSESLint.RuleModule<TMessageIds, TOptions> {
  return createContextRule('workflow', ruleDefinition, options);
}

/**
 * Create an activity-specific rule that only runs in activity context.
 */
export function createActivityRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(
  ruleDefinition: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
): TSESLint.RuleModule<TMessageIds, TOptions> {
  return createContextRule('activity', ruleDefinition);
}

/**
 * Create a worker-specific rule that only runs in worker context.
 */
export function createWorkerRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(
  ruleDefinition: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
): TSESLint.RuleModule<TMessageIds, TOptions> {
  return createContextRule('worker', ruleDefinition);
}

/**
 * Create a client-specific rule that only runs in client context.
 */
export function createClientRule<
  TOptions extends readonly unknown[],
  TMessageIds extends string,
>(
  ruleDefinition: Readonly<ESLintUtils.RuleWithMetaAndName<TOptions, TMessageIds>>,
): TSESLint.RuleModule<TMessageIds, TOptions> {
  return createContextRule('client', ruleDefinition);
}
