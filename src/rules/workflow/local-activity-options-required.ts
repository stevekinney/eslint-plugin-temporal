import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds =
  | 'missingOptions'
  | 'missingTimeout'
  | 'missingRetry'
  | 'missingTimeoutAndRetry';

const TIMEOUT_PROPERTIES = [
  'startToCloseTimeout',
  'scheduleToCloseTimeout',
  'scheduleToStartTimeout',
];

export const localActivityOptionsRequired = createWorkflowRule<[], MessageIds>({
  name: 'workflow-local-activity-options-required',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require proxyLocalActivities to configure explicit timeouts and a retry policy.',
    },
    messages: {
      missingOptions:
        'proxyLocalActivities() must include options with explicit timeouts and a retry policy.',
      missingTimeout:
        'proxyLocalActivities() must specify a timeout (startToCloseTimeout or scheduleToCloseTimeout).',
      missingRetry:
        'proxyLocalActivities() must specify a retry policy (retry: { ... }).',
      missingTimeoutAndRetry:
        'proxyLocalActivities() must specify timeouts and a retry policy.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isProxyLocalActivitiesCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === 'proxyLocalActivities'
      ) {
        return true;
      }

      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        node.callee.property.name === 'proxyLocalActivities'
      ) {
        return true;
      }

      return false;
    }

    return {
      CallExpression(node) {
        if (!isProxyLocalActivitiesCall(node)) return;

        const optionsArg = node.arguments[0];

        if (!optionsArg) {
          context.report({ node, messageId: 'missingOptions' });
          return;
        }

        if (optionsArg.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        const hasTimeout = TIMEOUT_PROPERTIES.some((prop) =>
          hasProperty(optionsArg, prop),
        );
        const hasRetry = hasProperty(optionsArg, 'retry');

        if (!hasTimeout && !hasRetry) {
          context.report({ node: optionsArg, messageId: 'missingTimeoutAndRetry' });
          return;
        }

        if (!hasTimeout) {
          context.report({ node: optionsArg, messageId: 'missingTimeout' });
          return;
        }

        if (!hasRetry) {
          context.report({ node: optionsArg, messageId: 'missingRetry' });
        }
      },
    };
  },
});
