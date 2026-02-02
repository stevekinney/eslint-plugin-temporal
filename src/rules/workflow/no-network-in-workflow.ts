import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { getBasePackageName } from '../../utilities/temporal-packages.ts';

const NETWORK_PACKAGES = new Set([
  'axios',
  'node-fetch',
  'undici',
  'got',
  'superagent',
  'request',
  'needle',
  'ky',
  'graphql-request',
  'cross-fetch',
]);

const NETWORK_GLOBALS = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource']);

type MessageIds = 'noNetwork';

function isTypeOnlyImport(node: TSESTree.ImportDeclaration): boolean {
  if (node.importKind === 'type') return true;
  if (!node.specifiers.length) return false;
  return node.specifiers.every(
    (specifier) =>
      specifier.type === AST_NODE_TYPES.ImportSpecifier &&
      specifier.importKind === 'type',
  );
}

export const noNetworkInWorkflow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-network-in-workflow',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow network access in workflows. Move HTTP calls to activities instead.',
    },
    messages: {
      noNetwork:
        'Workflows must not perform network I/O. Move this call into an activity or local activity.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function report(node: TSESTree.Node): void {
      context.report({ node, messageId: 'noNetwork' });
    }

    return {
      ImportDeclaration(node) {
        if (isTypeOnlyImport(node)) return;
        const base = getBasePackageName(node.source.value);
        if (NETWORK_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind === 'type') return;
        if (!node.source) return;
        const base = getBasePackageName(node.source.value);
        if (NETWORK_PACKAGES.has(base)) {
          report(node.source);
        }
      },
      CallExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (NETWORK_GLOBALS.has(node.callee.name)) {
            report(node.callee);
          }
        }
      },
      NewExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          if (NETWORK_GLOBALS.has(node.callee.name)) {
            report(node.callee);
          }
        }
      },
    };
  },
});
