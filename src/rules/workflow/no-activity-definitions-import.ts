import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noActivityDefinitionsImport' | 'convertToTypeImport';

export const noActivityDefinitionsImport = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-activity-definitions-import',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing activity implementations in workflow files. Use proxyActivities() instead.',
    },
    hasSuggestions: true,
    messages: {
      noActivityDefinitionsImport:
        'Do not import activity definitions directly in workflows. Activity functions contain non-deterministic code. Use proxyActivities<typeof activities>() to create type-safe activity stubs.',
      convertToTypeImport: 'Convert to type-only import.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;

        // Check if this is a relative import from an activities directory
        if (!importSource.startsWith('.')) {
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

        // Type-only imports are allowed
        if (node.importKind === 'type') {
          return;
        }

        // Check each specifier
        const hasValueImport = node.specifiers.some((specifier) => {
          // Default imports and namespace imports are value imports
          if (
            specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier ||
            specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier
          ) {
            // Namespace type imports are okay
            if (
              specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier &&
              node.importKind === 'type'
            ) {
              return false;
            }
            return true;
          }

          // Named imports - check if they're type imports
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            return specifier.importKind !== 'type';
          }

          return false;
        });

        if (hasValueImport) {
          const sourceCode = context.sourceCode;

          context.report({
            node,
            messageId: 'noActivityDefinitionsImport',
            suggest: [
              {
                messageId: 'convertToTypeImport',
                fix(fixer) {
                  // Get the import keyword token
                  const importKeyword = sourceCode.getFirstToken(node);
                  if (!importKeyword || importKeyword.value !== 'import') return null;

                  // Insert 'type' after 'import'
                  return fixer.insertTextAfter(importKeyword, ' type');
                },
              },
            ],
          });
        }
      },
    };
  },
});
