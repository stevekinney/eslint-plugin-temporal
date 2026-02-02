import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { getBasePackageName } from '../../utilities/temporal-packages.ts';

const UUID_PACKAGES = new Set([
  'uuid',
  'nanoid',
  'cuid',
  'cuid2',
  'ulid',
  'ksuid',
  'shortid',
  'hyperid',
]);

type MessageIds = 'noUuidLibrary';

function isTypeOnlyImport(node: TSESTree.ImportDeclaration): boolean {
  if (node.importKind === 'type') return true;
  if (!node.specifiers.length) return false;
  return node.specifiers.every(
    (specifier) =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier &&
      specifier.importKind === 'type',
  );
}

export const noUuidLibraryInWorkflow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-uuid-library-in-workflow',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow UUID libraries in workflows. Use uuid4() from @temporalio/workflow or generate IDs in activities.',
    },
    messages: {
      noUuidLibrary:
        'Do not use UUID libraries in workflows. Use uuid4() from @temporalio/workflow or generate IDs in activities.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function report(node: TSESTree.Node): void {
      context.report({ node, messageId: 'noUuidLibrary' });
    }

    return {
      ImportDeclaration(node) {
        if (isTypeOnlyImport(node)) return;
        const base = getBasePackageName(node.source.value);
        if (UUID_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        if (!node.source) return;
        const base = getBasePackageName(node.source.value);
        if (UUID_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      CallExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (node.callee.name === 'require') {
            const arg = node.arguments[0];
            if (arg?.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
              const base = getBasePackageName(arg.value);
              if (UUID_PACKAGES.has(base)) {
                report(arg);
              }
            }
          }
        }
      },
    };
  },
});
