import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'deprecatePatchRequired';

function isPatchedCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name === 'patched';
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name === 'patched';
  }

  return false;
}

function isDeprecatePatchCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name === 'deprecatePatch';
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name === 'deprecatePatch';
  }

  return false;
}

function getPatchId(arg: TSESTree.CallExpressionArgument | undefined): string | null {
  if (!arg) return null;

  if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === 'string') {
    return arg.value;
  }

  if (
    arg.type === AST_NODE_TYPES.TemplateLiteral &&
    arg.expressions.length === 0 &&
    arg.quasis.length === 1
  ) {
    return arg.quasis[0]?.value.cooked ?? null;
  }

  return null;
}

function isBranchRemovedContext(
  node: TSESTree.CallExpression,
  sourceCode: TSESLint.SourceCode,
): boolean {
  if (node.parent?.type === AST_NODE_TYPES.ExpressionStatement) {
    return true;
  }

  const ancestors = sourceCode.getAncestors(node);

  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const ancestor = ancestors[i];
    if (!ancestor) {
      continue;
    }
    if (ancestor.type !== AST_NODE_TYPES.IfStatement) {
      continue;
    }

    const test = ancestor.test;
    const inTest = Boolean(test && (test === node || ancestors.includes(test)));
    if (!inTest) {
      continue;
    }

    if (ancestor.alternate) {
      return false;
    }

    const isNegated = ancestors.some(
      (entry) => entry.type === AST_NODE_TYPES.UnaryExpression && entry.operator === '!',
    );

    if (isNegated) {
      return false;
    }

    return true;
  }

  return false;
}

export const requireDeprecatePatchAfterBranchRemoval = createWorkflowRule<[], MessageIds>(
  {
    name: 'workflow-require-deprecate-patch-after-branch-removal',
    meta: {
      type: 'suggestion',
      docs: {
        description:
          'Require deprecatePatch() after removing the fallback branch guarded by patched().',
      },
      messages: {
        deprecatePatchRequired:
          'Patch "{{ patchId }}" no longer has a fallback branch. Add deprecatePatch("{{ patchId }}") once the old path is removed to keep replay compatibility explicit.',
      },
      schema: [],
    },
    defaultOptions: [],
    create(context) {
      const deprecatePatchIds = new Set<string>();
      const patchIdsNeedingDeprecation: Array<{ patchId: string; node: TSESTree.Node }> =
        [];

      return {
        CallExpression(node) {
          if (isDeprecatePatchCall(node)) {
            const patchId = getPatchId(node.arguments[0]);
            if (patchId) {
              deprecatePatchIds.add(patchId);
            }
            return;
          }

          if (!isPatchedCall(node)) {
            return;
          }

          const patchId = getPatchId(node.arguments[0]);
          if (!patchId) {
            return;
          }

          if (!isBranchRemovedContext(node, context.sourceCode)) {
            return;
          }

          patchIdsNeedingDeprecation.push({
            patchId,
            node,
          });
        },

        'Program:exit'() {
          const reported = new Set<string>();

          for (const entry of patchIdsNeedingDeprecation) {
            if (deprecatePatchIds.has(entry.patchId)) {
              continue;
            }

            if (reported.has(entry.patchId)) {
              continue;
            }

            reported.add(entry.patchId);
            context.report({
              node: entry.node,
              messageId: 'deprecatePatchRequired',
              data: {
                patchId: entry.patchId,
              },
            });
          }
        },
      };
    },
  },
);
