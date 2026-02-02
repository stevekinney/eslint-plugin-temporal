import type { TSESLint } from '@typescript-eslint/utils';
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

import type { TemporalFileType, TemporalPluginSettings } from '../types.ts';
import { detectTemporalFileType } from './file-detection.ts';
import { ImportTracker } from './import-tracker.ts';
import { detectContext, isContextMatch } from './temporal-context.ts';

const DOCS_BASE_URL =
  'https://github.com/stevekinney/eslint-plugin-temporal/blob/main/docs/rules';

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

      const originalListeners = originalCreate(context, ruleOptions);

      let contextDetermined = false;
      let shouldRun = false;
      let importsSeeded = false;

      function seedImportsFromProgram(): void {
        if (importsSeeded) return;
        importsSeeded = true;

        const program = context.sourceCode.ast;
        for (const statement of program.body) {
          if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
            tracker.addImport(statement);
          }
        }
      }

      function checkContext(): void {
        if (contextDetermined) return;

        seedImportsFromProgram();

        const filename = context.filename;
        const settings = context.settings?.['temporal'] as
          | TemporalPluginSettings
          | undefined;
        const result = detectContext(tracker, filename, settings);
        shouldRun = isContextMatch(result.context, expectedContext, {
          treatTestAsWorkflow,
        });
        if (!shouldRun) {
          const fileContext = detectTemporalFileType(filename, settings?.filePatterns);
          shouldRun = isContextMatch(fileContext, expectedContext, {
            treatTestAsWorkflow,
          });
        }
        contextDetermined = true;
      }

      const wrappedListeners: RuleListener = {};

      for (const [selector, listener] of Object.entries(originalListeners)) {
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
