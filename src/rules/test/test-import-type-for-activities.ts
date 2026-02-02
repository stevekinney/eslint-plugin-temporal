import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createContextRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'requireTypeOnlyImport';

export const testImportTypeForActivities = createContextRule<[], MessageIds>('test', {
  name: 'test-import-type-for-activities',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require type-only imports for activity modules in tests to avoid loading implementations when building mocks.',
    },
    messages: {
      requireTypeOnlyImport:
        "Activity imports in tests must use `import type` to avoid pulling implementations into the test bundle. Change to: import type { ... } from '{{ source }}'",
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

        if (typeof importSource !== 'string' || !importSource.startsWith('.')) {
          return;
        }

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

        if (node.importKind === 'type') {
          return;
        }

        const hasValueImport = node.specifiers.some((specifier) => {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            return specifier.importKind !== 'type';
          }
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
