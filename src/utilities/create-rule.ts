import { ESLintUtils } from '@typescript-eslint/utils';

const DOCS_BASE_URL =
  'https://github.com/temporalio/eslint-plugin-temporal/blob/main/docs/rules';

/**
 * Creates a rule with consistent documentation URL generation.
 *
 * Usage:
 * ```typescript
 * export const rule = createRule({
 *   name: 'my-rule-name',
 *   meta: { ... },
 *   defaultOptions: [],
 *   create(context) { ... }
 * });
 * ```
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) => `${DOCS_BASE_URL}/${name}.md`,
);
