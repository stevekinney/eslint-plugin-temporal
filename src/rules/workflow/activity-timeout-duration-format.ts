import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getProperty } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type Options = [
  {
    format?: 'string' | 'number';
  },
];

type MessageIds = 'timeoutFormat';

const TIMEOUT_PROPERTIES = new Set([
  'startToCloseTimeout',
  'scheduleToCloseTimeout',
  'scheduleToStartTimeout',
  'heartbeatTimeout',
]);

type DurationKind = 'string' | 'number';

export const activityTimeoutDurationFormat = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-activity-timeout-duration-format',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a consistent duration literal format for activity timeouts in proxyActivities options.',
    },
    messages: {
      timeoutFormat:
        'Use {{ expected }} duration literals for {{ property }} (got {{ actual }}).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['string', 'number'],
            description:
              'Preferred duration literal format for activity timeouts (string duration vs millisecond number).',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ format: 'string' }],
  },
  defaultOptions: [{ format: 'string' }],
  create(context, [options]) {
    const expected = options.format ?? 'string';

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

    function getLiteralKind(node: TSESTree.Expression): DurationKind | null {
      if (node.type === AST_NODE_TYPES.Literal) {
        if (typeof node.value === 'number') return 'number';
        if (typeof node.value === 'string') return 'string';
      }

      if (
        node.type === AST_NODE_TYPES.TemplateLiteral &&
        node.expressions.length === 0 &&
        node.quasis.length === 1
      ) {
        return 'string';
      }

      return null;
    }

    function getExpectedLabel(format: DurationKind): string {
      return format === 'string' ? 'string' : 'millisecond number';
    }

    function checkTimeoutProperty(
      node: TSESTree.ObjectExpression,
      property: string,
    ): void {
      const prop = getProperty(node, property);
      if (!prop) return;

      const literalKind = getLiteralKind(prop.value as TSESTree.Expression);
      if (!literalKind) return;

      if (literalKind === expected) return;

      context.report({
        node: prop.value,
        messageId: 'timeoutFormat',
        data: {
          expected: getExpectedLabel(expected),
          actual: literalKind,
          property,
        },
      });
    }

    return {
      CallExpression(node) {
        if (!isProxyActivitiesCall(node)) return;

        const optionsArg = node.arguments[0];
        if (!optionsArg || optionsArg.type !== AST_NODE_TYPES.ObjectExpression) return;

        for (const property of TIMEOUT_PROPERTIES) {
          checkTimeoutProperty(optionsArg, property);
        }
      },
    };
  },
});
