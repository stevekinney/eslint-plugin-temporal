import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'missingStateArgument' | 'addStatePlaceholder';

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
  name: 'workflow-no-continue-as-new-without-state-argument',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require continueAsNew() to receive workflow state arguments so state is preserved across runs.',
    },
    hasSuggestions: true,
    messages: {
      missingStateArgument:
        'continueAsNew() should pass workflow state arguments to the next run. Provide the state you need to carry forward.',
      addStatePlaceholder: 'Add state argument placeholder.',
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

        const sourceCode = context.sourceCode;

        // Get the opening paren
        const openParen = sourceCode.getTokenAfter(
          node.callee,
          (token) => token.value === '(',
        );

        context.report({
          node,
          messageId: 'missingStateArgument',
          suggest: [
            {
              messageId: 'addStatePlaceholder',
              fix(fixer) {
                if (!openParen) return null;
                return fixer.insertTextAfter(
                  openParen,
                  '/* TODO: pass workflow state */',
                );
              },
            },
          ],
        });
      },
    };
  },
});
