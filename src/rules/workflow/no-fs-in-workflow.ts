import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { getBasePackageName } from '../../utilities/temporal-packages.ts';

const FS_PACKAGES = new Set([
  'fs',
  'fs-extra',
  'glob',
  'globby',
  'rimraf',
  'mkdirp',
  'chokidar',
]);

type MessageIds = 'noFs';

function isTypeOnlyImport(node: TSESTree.ImportDeclaration): boolean {
  if (node.importKind === 'type') return true;
  if (!node.specifiers.length) return false;
  return node.specifiers.every(
    (specifier) =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier &&
      specifier.importKind === 'type',
  );
}

export const noFsInWorkflow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-fs-in-workflow',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow filesystem access in workflows. Move filesystem I/O to activities.',
    },
    messages: {
      noFs: 'Workflows must not access the filesystem. Move file I/O into an activity or local activity.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function report(node: TSESTree.Node): void {
      context.report({ node, messageId: 'noFs' });
    }

    return {
      ImportDeclaration(node) {
        if (isTypeOnlyImport(node)) return;
        const base = getBasePackageName(node.source.value);
        if (FS_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        if (!node.source) return;
        const base = getBasePackageName(node.source.value);
        if (FS_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      CallExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (node.callee.name === 'require') {
            const arg = node.arguments[0];
            if (arg?.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
              const base = getBasePackageName(arg.value);
              if (FS_PACKAGES.has(base)) {
                report(arg);
              }
            }
          }
        }
      },
    };
  },
});
