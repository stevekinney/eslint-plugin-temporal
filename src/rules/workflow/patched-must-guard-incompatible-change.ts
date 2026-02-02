import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'patchedMustGuard';

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

function isInConditionalTest(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean {
  const ancestors = sourceCode.getAncestors(node);

  const isTestNode = (test: TSESTree.Node | null | undefined): boolean =>
    Boolean(test && (test === node || ancestors.includes(test)));

  for (const ancestor of ancestors) {
    switch (ancestor.type) {
      case AST_NODE_TYPES.IfStatement:
      case AST_NODE_TYPES.WhileStatement:
      case AST_NODE_TYPES.DoWhileStatement:
      case AST_NODE_TYPES.ForStatement:
      case AST_NODE_TYPES.ConditionalExpression:
        if (isTestNode(ancestor.test)) {
          return true;
        }
        break;
      case AST_NODE_TYPES.SwitchCase:
        if (isTestNode(ancestor.test)) {
          return true;
        }
        break;
      default:
        break;
    }
  }

  return false;
}

export const patchedMustGuardIncompatibleChange = createWorkflowRule<[], MessageIds>({
  name: 'workflow-patched-must-guard-incompatible-change',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require patched() to be used in a conditional guard to protect incompatible workflow changes.',
    },
    messages: {
      patchedMustGuard:
        'Use patched() in a conditional guard (if/?:) to gate incompatible changes. Calling patched() without guarding does not protect replay determinism.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        if (!isPatchedCall(node)) return;
        if (isInConditionalTest(node, sourceCode)) return;

        context.report({
          node,
          messageId: 'patchedMustGuard',
        });
      },
    };
  },
});
