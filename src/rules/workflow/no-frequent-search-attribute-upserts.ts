import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getEnclosingLoop } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'avoidFrequentUpserts';

function isUpsertSearchAttributesCall(node: TSESTree.CallExpression): boolean {
  if (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'upsertSearchAttributes'
  ) {
    return true;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'upsertSearchAttributes'
  ) {
    return true;
  }

  if (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Literal &&
    node.callee.property.value === 'upsertSearchAttributes'
  ) {
    return true;
  }

  return false;
}

export const noFrequentSearchAttributeUpserts = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-frequent-search-attribute-upserts',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when upsertSearchAttributes is called inside loops (history bloat risk).',
    },
    messages: {
      avoidFrequentUpserts:
        'Avoid calling upsertSearchAttributes inside loops. Frequent updates bloat workflow history; batch updates or move the upsert outside the loop.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (!isUpsertSearchAttributesCall(node)) {
          return;
        }

        const loop = getEnclosingLoop(node);
        if (!loop) return;

        context.report({
          node,
          messageId: 'avoidFrequentUpserts',
        });
      },
    };
  },
});
