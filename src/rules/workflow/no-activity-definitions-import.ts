import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noActivityDefinitionsImport';

export const noActivityDefinitionsImport = createRule<[], MessageIds>({
  name: 'no-activity-definitions-import',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing activity implementations in workflow files. Use proxyActivities() instead.',
    },
    messages: {
      noActivityDefinitionsImport:
        'Do not import activity definitions directly in workflows. Activity functions contain non-deterministic code. Use proxyActivities<typeof activities>() to create type-safe activity stubs.',
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
          context.report({
            node,
            messageId: 'noActivityDefinitionsImport',
          });
        }
      },
    };
  },
});
