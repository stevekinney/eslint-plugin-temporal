import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type Options = [
  {
    maxArrayElements?: number;
    maxObjectProperties?: number;
    maxStringLength?: number;
  },
];

type MessageIds = 'largeArrayConstant' | 'largeObjectConstant' | 'largeStringConstant';

const DEFAULT_MAX_ARRAY_ELEMENTS = 100;
const DEFAULT_MAX_OBJECT_PROPERTIES = 50;
const DEFAULT_MAX_STRING_LENGTH = 10000;

function countObjectProperties(node: TSESTree.ObjectExpression): number {
  let count = 0;
  for (const prop of node.properties) {
    if (prop.type === AST_NODE_TYPES.Property) {
      count++;
      if (prop.value.type === AST_NODE_TYPES.ObjectExpression) {
        count += countObjectProperties(prop.value);
      }
    } else if (prop.type === AST_NODE_TYPES.SpreadElement) {
      count++;
    }
  }
  return count;
}

function countArrayElements(node: TSESTree.ArrayExpression): number {
  let count = 0;
  for (const element of node.elements) {
    if (element === null) {
      count++;
    } else if (element.type === AST_NODE_TYPES.SpreadElement) {
      count++;
    } else {
      count++;
      if (element.type === AST_NODE_TYPES.ArrayExpression) {
        count += countArrayElements(element);
      }
    }
  }
  return count;
}

function unwrapExpression(node: TSESTree.Expression): TSESTree.Expression {
  let current = node;
  while (true) {
    if (
      current.type === AST_NODE_TYPES.TSAsExpression ||
      current.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
      current = current.expression;
      continue;
    }

    if (current.type === AST_NODE_TYPES.TSNonNullExpression) {
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

export const noLargeInlineConstants = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-large-inline-constants',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn on large inline array/object/string constants in workflow files to reduce bundle size and memory usage.',
    },
    messages: {
      largeArrayConstant:
        'Avoid large inline array literals ({{ count }} elements) in workflow code. Move data out of the workflow bundle or load it in an activity.',
      largeObjectConstant:
        'Avoid large inline object literals ({{ count }} properties) in workflow code. Move data out of the workflow bundle or load it in an activity.',
      largeStringConstant:
        'Avoid large inline string literals ({{ length }} characters) in workflow code. Move data out of the workflow bundle or load it in an activity.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxArrayElements: {
            type: 'number',
            minimum: 1,
            description: 'Maximum number of elements allowed in array literals.',
          },
          maxObjectProperties: {
            type: 'number',
            minimum: 1,
            description: 'Maximum number of properties allowed in object literals.',
          },
          maxStringLength: {
            type: 'number',
            minimum: 1,
            description: 'Maximum length allowed for string literals.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const maxArrayElements = options.maxArrayElements ?? DEFAULT_MAX_ARRAY_ELEMENTS;
    const maxObjectProperties =
      options.maxObjectProperties ?? DEFAULT_MAX_OBJECT_PROPERTIES;
    const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;

    function checkLiteral(node: TSESTree.Expression): void {
      const target = unwrapExpression(node);

      if (target.type === AST_NODE_TYPES.ArrayExpression) {
        const count = countArrayElements(target);
        if (count > maxArrayElements) {
          context.report({
            node: target,
            messageId: 'largeArrayConstant',
            data: { count: String(count) },
          });
        }
        return;
      }

      if (target.type === AST_NODE_TYPES.ObjectExpression) {
        const count = countObjectProperties(target);
        if (count > maxObjectProperties) {
          context.report({
            node: target,
            messageId: 'largeObjectConstant',
            data: { count: String(count) },
          });
        }
        return;
      }

      if (target.type === AST_NODE_TYPES.Literal && typeof target.value === 'string') {
        if (target.value.length > maxStringLength) {
          context.report({
            node: target,
            messageId: 'largeStringConstant',
            data: { length: String(target.value.length) },
          });
        }
        return;
      }

      if (
        target.type === AST_NODE_TYPES.TemplateLiteral &&
        target.expressions.length === 0
      ) {
        const totalLength = target.quasis.reduce(
          (sum, quasi) => sum + quasi.value.raw.length,
          0,
        );
        if (totalLength > maxStringLength) {
          context.report({
            node: target,
            messageId: 'largeStringConstant',
            data: { length: String(totalLength) },
          });
        }
      }
    }

    function isTopLevelVariableDeclarator(node: TSESTree.VariableDeclarator): boolean {
      const parent = node.parent;
      if (!parent || parent.type !== AST_NODE_TYPES.VariableDeclaration) return false;
      const grand = parent.parent;
      return (
        grand?.type === AST_NODE_TYPES.Program ||
        grand?.type === AST_NODE_TYPES.ExportNamedDeclaration
      );
    }

    return {
      VariableDeclarator(node) {
        if (!isTopLevelVariableDeclarator(node)) return;
        if (!node.init) return;
        checkLiteral(node.init);
      },
      ExportDefaultDeclaration(node) {
        const decl = node.declaration;
        if (
          decl.type !== AST_NODE_TYPES.ObjectExpression &&
          decl.type !== AST_NODE_TYPES.ArrayExpression &&
          decl.type !== AST_NODE_TYPES.Literal &&
          decl.type !== AST_NODE_TYPES.TemplateLiteral
        ) {
          return;
        }

        if (decl.type === AST_NODE_TYPES.Literal && typeof decl.value !== 'string') {
          return;
        }

        checkLiteral(decl as TSESTree.Expression);
      },
    };
  },
});
