import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'invalidSearchAttributeValue';

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

function unwrapExpression(node: TSESTree.Expression): TSESTree.Expression {
  let current = node;
  while (true) {
    if (
      current.type === AST_NODE_TYPES.TSAsExpression ||
      current.type === AST_NODE_TYPES.TSTypeAssertion ||
      current.type === AST_NODE_TYPES.TSNonNullExpression
    ) {
      current = current.expression;
      continue;
    }
    if (current.type === AST_NODE_TYPES.ChainExpression) {
      current = current.expression;
      continue;
    }
    return current;
  }
}

function isExpression(node: TSESTree.Node): node is TSESTree.Expression {
  return !(
    node.type === AST_NODE_TYPES.ObjectPattern ||
    node.type === AST_NODE_TYPES.ArrayPattern ||
    node.type === AST_NODE_TYPES.AssignmentPattern ||
    node.type === AST_NODE_TYPES.RestElement
  );
}

function isInvalidSearchAttributeValue(node: TSESTree.Node): boolean {
  if (!isExpression(node)) {
    return false;
  }

  const target = unwrapExpression(node);

  if (target.type === AST_NODE_TYPES.ArrayExpression) {
    return false;
  }

  if (target.type === AST_NODE_TYPES.Identifier) {
    return target.name === 'undefined';
  }

  if (target.type === AST_NODE_TYPES.UnaryExpression && target.operator === 'void') {
    return true;
  }

  if (target.type === AST_NODE_TYPES.Literal) {
    return true;
  }

  if (target.type === AST_NODE_TYPES.TemplateLiteral) {
    return true;
  }

  if (target.type === AST_NODE_TYPES.ObjectExpression) {
    return true;
  }

  if (
    target.type === AST_NODE_TYPES.FunctionExpression ||
    target.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    target.type === AST_NODE_TYPES.ClassExpression ||
    target.type === AST_NODE_TYPES.NewExpression
  ) {
    return true;
  }

  return false;
}

export const searchAttributesUpsertShape = createWorkflowRule<[], MessageIds>({
  name: 'workflow-search-attributes-upsert-shape',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require upsertSearchAttributes values to be arrays and removals to use empty arrays.',
    },
    messages: {
      invalidSearchAttributeValue:
        'Search attribute values must be arrays. Use [] to remove a value instead of null or undefined.',
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

        const arg = node.arguments[0];
        if (!arg || arg.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        for (const prop of arg.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue;

          if (isInvalidSearchAttributeValue(prop.value)) {
            context.report({
              node: prop.value,
              messageId: 'invalidSearchAttributeValue',
            });
          }
        }
      },
    };
  },
});
