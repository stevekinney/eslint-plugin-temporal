import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'requireTypeOnlyImport';

export const requireTypeOnlyActivityImports = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-type-only-activity-imports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require type-only imports for activity modules. Non-type imports pull non-deterministic code into the workflow bundle.',
    },
    messages: {
      requireTypeOnlyImport:
        "Activity imports must use `import type` to avoid pulling non-deterministic code into the workflow bundle. Change to: import type { ... } from '{{ source }}'",
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;

        // Only check relative imports from activity directories
        if (typeof importSource !== 'string' || !importSource.startsWith('.')) {
          return;
        }

        // Check for activity-related patterns in the import path
        const activityPatterns = [
          /\/activities(\/|$)/,
          /\.activities$/,
          /\/activity(\/|$)/,
          /\.activity$/,
        ];

        const isActivityImport = activityPatterns.some((pattern) =>
          pattern.test(importSource),
        );

        if (!isActivityImport) {
          return;
        }

        // Type-only imports are fine
        if (node.importKind === 'type') {
          return;
        }

        // Check if all specifiers are type imports
        const hasValueImport = node.specifiers.some((specifier) => {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            return specifier.importKind !== 'type';
          }
          // Default imports and namespace imports are value imports
          return true;
        });

        if (!hasValueImport) {
          return;
        }

        context.report({
          node,
          messageId: 'requireTypeOnlyImport',
          data: {
            source: importSource,
          },
          *fix(fixer) {
            // Add 'type' after 'import'
            const importKeyword = sourceCode.getFirstToken(node);
            if (importKeyword && importKeyword.value === 'import') {
              yield fixer.insertTextAfter(importKeyword, ' type');
            }
          },
        });
      },
    };
  },
});
