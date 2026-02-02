import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { getBasePackageName } from '../../utilities/temporal-packages.ts';

const LOGGER_PACKAGES = new Set(['winston', 'pino', 'bunyan', 'log4js']);

type MessageIds = 'noLoggerLibrary';

function isTypeOnlyImport(node: TSESTree.ImportDeclaration): boolean {
  if (node.importKind === 'type') return true;
  if (!node.specifiers.length) return false;
  return node.specifiers.every(
    (specifier) =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier &&
      specifier.importKind === 'type',
  );
}

export const noLoggerLibraryInWorkflow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-logger-library-in-workflow',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow logger libraries in workflows. Use log from @temporalio/workflow instead.',
    },
    messages: {
      noLoggerLibrary:
        'Do not use logger libraries in workflows. Use log from @temporalio/workflow instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function report(node: TSESTree.Node): void {
      context.report({ node, messageId: 'noLoggerLibrary' });
    }

    return {
      ImportDeclaration(node) {
        if (isTypeOnlyImport(node)) return;
        const base = getBasePackageName(node.source.value);
        if (LOGGER_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        if (!node.source) return;
        const base = getBasePackageName(node.source.value);
        if (LOGGER_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      CallExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (node.callee.name === 'require') {
            const arg = node.arguments[0];
            if (arg?.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
              const base = getBasePackageName(arg.value);
              if (LOGGER_PACKAGES.has(base)) {
                report(arg);
              }
            }
          }
        }
      },
    };
  },
});
