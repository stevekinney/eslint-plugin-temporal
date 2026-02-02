import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

const FORBIDDEN_EXPORT_SOURCES = new Set<string>([
  TEMPORAL_PACKAGES.worker,
  TEMPORAL_PACKAGES.client,
  TEMPORAL_PACKAGES.activity,
]);

type MessageIds = 'mixedScopeExport';

export const noMixedScopeExports = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-mixed-scope-exports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow exporting Worker/Client/Activity values from workflow files. Keep workflow exports scoped to workflow code and message definitions.',
    },
    messages: {
      mixedScopeExport:
        'Do not export non-workflow runtime values from workflow files. Move Worker/Client/Activity exports into separate modules.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const tracker = new ImportTracker();
    const forbiddenLocals = new Set<string>();

    function isTypeOnlyExport(node: TSESTree.ExportNamedDeclaration): boolean {
      return node.exportKind === 'type';
    }

    function seedForbiddenLocals(): void {
      for (const source of FORBIDDEN_EXPORT_SOURCES) {
        for (const spec of tracker.getValueSpecifiers(source)) {
          forbiddenLocals.add(spec.local);
        }
      }
    }

    function report(node: TSESTree.Node): void {
      context.report({ node, messageId: 'mixedScopeExport' });
    }

    function isForbiddenCallee(node: TSESTree.Expression): boolean {
      if (node.type === AST_NODE_TYPES.Identifier) {
        return forbiddenLocals.has(node.name);
      }
      return false;
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      'Program:exit'(node) {
        seedForbiddenLocals();

        for (const statement of node.body) {
          if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
            if (statement.source && !isTypeOnlyExport(statement)) {
              if (FORBIDDEN_EXPORT_SOURCES.has(statement.source.value)) {
                report(statement.source);
                continue;
              }
            }

            for (const specifier of statement.specifiers) {
              if (
                specifier.type === AST_NODE_TYPES.ExportSpecifier &&
                specifier.local.type === AST_NODE_TYPES.Identifier &&
                forbiddenLocals.has(specifier.local.name)
              ) {
                report(specifier);
              }
            }

            if (statement.declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
              for (const declarator of statement.declaration.declarations) {
                const init = declarator.init;
                if (!init) continue;
                if (
                  init.type === AST_NODE_TYPES.NewExpression ||
                  init.type === AST_NODE_TYPES.CallExpression
                ) {
                  if (isForbiddenCallee(init.callee)) {
                    report(init);
                  }
                }
              }
            }
          }

          if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
            const decl = statement.declaration;
            if (decl.type === AST_NODE_TYPES.Identifier) {
              if (forbiddenLocals.has(decl.name)) {
                report(decl);
              }
            }

            if (
              decl.type === AST_NODE_TYPES.NewExpression ||
              decl.type === AST_NODE_TYPES.CallExpression
            ) {
              if (isForbiddenCallee(decl.callee)) {
                report(decl);
              }
            }
          }
        }
      },
    };
  },
});
