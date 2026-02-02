import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

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

export const noLargeLiteralActivityPayloads = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-large-literal-activity-payloads',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when passing large literal arrays, objects, or strings to activities. Large payloads bloat workflow history.',
    },
    defaultOptions: [{}],
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
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const maxArrayElements = options.maxArrayElements ?? DEFAULT_MAX_ARRAY_ELEMENTS;
    const maxObjectProperties =
      options.maxObjectProperties ?? DEFAULT_MAX_OBJECT_PROPERTIES;
    const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH;

    const activityProxyVariables = new Set<string>();
    const directActivityFns = new Set<string>();

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

    function checkPayload(node: TSESTree.CallExpressionArgument): void {
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
      }
    }

    function isProxyActivitiesCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        (node.callee.name === 'proxyActivities' ||
          node.callee.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        (node.callee.property.name === 'proxyActivities' ||
          node.callee.property.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      return false;
    }

    function isActivityCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
          return activityProxyVariables.has(node.callee.object.name);
        }
      }

      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return directActivityFns.has(node.callee.name);
      }

      return false;
    }

    return {
      VariableDeclarator(node) {
        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isProxyActivitiesCall(node.init)) return;

        if (node.id.type === AST_NODE_TYPES.Identifier) {
          activityProxyVariables.add(node.id.name);
          return;
        }

        if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
          for (const property of node.id.properties) {
            if (
              property.type === AST_NODE_TYPES.Property &&
              property.key.type === AST_NODE_TYPES.Identifier
            ) {
              directActivityFns.add(property.key.name);
            }
          }
        }
      },
      CallExpression(node) {
        if (!isActivityCall(node)) return;

        for (const arg of node.arguments) {
          checkPayload(arg);
        }
      },
    };
  },
});
