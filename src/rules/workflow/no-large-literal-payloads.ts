import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type Options = [
  {
    maxArrayElements?: number;
    maxObjectProperties?: number;
    maxStringLength?: number;
  },
];

type MessageIds = 'largeArrayPayload' | 'largeObjectPayload' | 'largeStringPayload';

const DEFAULT_MAX_ARRAY_ELEMENTS = 100;
const DEFAULT_MAX_OBJECT_PROPERTIES = 50;
const DEFAULT_MAX_STRING_LENGTH = 10000;

export const noLargeLiteralPayloads = createRule<Options, MessageIds>({
  name: 'no-large-literal-payloads',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when passing large literal arrays, objects, or strings as arguments to activities or child workflows. Large payloads bloat workflow history.',
    },
    messages: {
      largeArrayPayload:
        'Avoid passing large array literals ({{ count }} elements) to activities. Large payloads bloat workflow history and slow down replay. Consider passing a reference or identifier instead, or breaking the data into smaller chunks.',
      largeObjectPayload:
        'Avoid passing large object literals ({{ count }} properties) to activities. Large payloads bloat workflow history and slow down replay. Consider passing a reference or identifier instead.',
      largeStringPayload:
        'Avoid passing large string literals ({{ length }} characters) to activities. Large payloads bloat workflow history and slow down replay. Consider passing a reference or fetching the data in the activity.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxArrayElements: {
            type: 'number',
            minimum: 1,
          },
          maxObjectProperties: {
            type: 'number',
            minimum: 1,
          },
          maxStringLength: {
            type: 'number',
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const maxArrayElements = options.maxArrayElements ?? DEFAULT_MAX_ARRAY_ELEMENTS;
    const maxObjectProperties =
      options.maxObjectProperties ?? DEFAULT_MAX_OBJECT_PROPERTIES;
    const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;

    // Track activity proxy variables
    const activityProxyVariables = new Set<string>();

    function countObjectProperties(node: TSESTree.ObjectExpression): number {
      let count = 0;
      for (const prop of node.properties) {
        if (prop.type === AST_NODE_TYPES.Property) {
          count++;
          // Recursively count nested object properties
          if (prop.value.type === AST_NODE_TYPES.ObjectExpression) {
            count += countObjectProperties(prop.value);
          }
        } else if (prop.type === AST_NODE_TYPES.SpreadElement) {
          // Can't statically count spread elements
          count++;
        }
      }
      return count;
    }

    function countArrayElements(node: TSESTree.ArrayExpression): number {
      let count = 0;
      for (const element of node.elements) {
        if (element === null) {
          count++; // Sparse array element
        } else if (element.type === AST_NODE_TYPES.SpreadElement) {
          // Can't statically count spread elements
          count++;
        } else {
          count++;
          // Recursively count nested arrays
          if (element.type === AST_NODE_TYPES.ArrayExpression) {
            count += countArrayElements(element);
          }
        }
      }
      return count;
    }

    function checkPayload(node: TSESTree.CallExpressionArgument): void {
      // Check array literals
      if (node.type === AST_NODE_TYPES.ArrayExpression) {
        const count = countArrayElements(node);
        if (count > maxArrayElements) {
          context.report({
            node,
            messageId: 'largeArrayPayload',
            data: { count: String(count) },
          });
        }
        return;
      }

      // Check object literals
      if (node.type === AST_NODE_TYPES.ObjectExpression) {
        const count = countObjectProperties(node);
        if (count > maxObjectProperties) {
          context.report({
            node,
            messageId: 'largeObjectPayload',
            data: { count: String(count) },
          });
        }
        return;
      }

      // Check string literals
      if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
        if (node.value.length > maxStringLength) {
          context.report({
            node,
            messageId: 'largeStringPayload',
            data: { length: String(node.value.length) },
          });
        }
        return;
      }

      // Check template literals
      if (node.type === AST_NODE_TYPES.TemplateLiteral) {
        const totalLength = node.quasis.reduce(
          (sum, quasi) => sum + quasi.value.raw.length,
          0,
        );
        if (totalLength > maxStringLength) {
          context.report({
            node,
            messageId: 'largeStringPayload',
            data: { length: String(totalLength) },
          });
        }
        return;
      }
    }

    function isActivityCall(node: TSESTree.CallExpression): boolean {
      // Check for activities.methodName() pattern
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
          return activityProxyVariables.has(node.callee.object.name);
        }
      }
      return false;
    }

    function isChildWorkflowCall(node: TSESTree.CallExpression): boolean {
      // Check for startChild(), executeChild()
      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return node.callee.name === 'startChild' || node.callee.name === 'executeChild';
      }
      return false;
    }

    return {
      // Track proxyActivities and proxyLocalActivities variable assignments
      VariableDeclarator(node) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          node.init.type !== AST_NODE_TYPES.CallExpression
        ) {
          return;
        }

        if (
          node.init.callee.type === AST_NODE_TYPES.Identifier &&
          (node.init.callee.name === 'proxyActivities' ||
            node.init.callee.name === 'proxyLocalActivities')
        ) {
          activityProxyVariables.add(node.id.name);
        }
      },

      CallExpression(node) {
        // Check activity calls
        if (isActivityCall(node) || isChildWorkflowCall(node)) {
          for (const arg of node.arguments) {
            checkPayload(arg);
          }
        }
      },
    };
  },
});
