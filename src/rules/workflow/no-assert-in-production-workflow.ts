import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noAssertInWorkflow';

const ASSERT_MODULES = new Set([
  'assert',
  'assert/strict',
  'node:assert',
  'node:assert/strict',
]);

function isAssertImport(source: string): boolean {
  return ASSERT_MODULES.has(source);
}

export const noAssertInProductionWorkflow = createWorkflowRule<[], MessageIds>(
  {
    name: 'workflow-no-assert-in-production-workflow',
    meta: {
      type: 'problem',
      docs: {
        description:
          'Disallow Node.js assert usage in workflow code outside tests to avoid replay failures and workflow task retries.',
      },
      messages: {
        noAssertInWorkflow:
          'Avoid Node assert in workflow code. Failed asserts can trigger workflow task retries and replay issues. Throw ApplicationFailure or handle errors explicitly.',
      },
      schema: [],
    },
    defaultOptions: [],
    create(context) {
      return {
        ImportDeclaration(node) {
          const source = node.source.value;
          if (typeof source !== 'string' || !isAssertImport(source)) return;
          if (node.importKind === 'type') return;

          const hasValueImport = node.specifiers.some((specifier) => {
            if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
              return specifier.importKind !== 'type';
            }
            return true;
          });

          if (!hasValueImport) return;

          context.report({
            node,
            messageId: 'noAssertInWorkflow',
          });
        },

        CallExpression(node) {
          if (
            node.callee.type !== AST_NODE_TYPES.Identifier ||
            node.callee.name !== 'require'
          ) {
            return;
          }

          const arg = node.arguments[0];
          if (!arg || arg.type !== AST_NODE_TYPES.Literal) return;
          if (typeof arg.value !== 'string') return;

          if (!isAssertImport(arg.value)) return;

          context.report({
            node,
            messageId: 'noAssertInWorkflow',
          });
        },
      };
    },
  },
  { treatTestAsWorkflow: false },
);
