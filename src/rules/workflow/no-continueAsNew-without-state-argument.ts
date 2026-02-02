import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'missingStateArgument';

function isContinueAsNewCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name === 'continueAsNew';
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.callee.property.name === 'continueAsNew';
  }

  return false;
}

export const noContinueAsNewWithoutStateArgument = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-continueAsNew-without-state-argument',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require continueAsNew() to receive workflow state arguments so state is preserved across runs.',
    },
    messages: {
      missingStateArgument:
        'continueAsNew() should pass workflow state arguments to the next run. Provide the state you need to carry forward.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isContinueAsNewCall(node)) return;

        if (node.arguments.length > 0) {
          return;
        }

        context.report({
          node,
          messageId: 'missingStateArgument',
        });
      },
    };
  },
});
