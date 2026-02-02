import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'missingRetryPolicy';

export const requireActivityRetryPolicy = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-activity-retry-policy',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit retry policy configuration in proxyActivities. Explicit retry policies make activity behavior more predictable and reviewable.',
    },
    messages: {
      missingRetryPolicy:
        'proxyActivities() should include an explicit retry policy. Add a `retry` option to make activity retry behavior explicit and reviewable. Example: proxyActivities({ startToCloseTimeout: "1m", retry: { maximumAttempts: 3 } })',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a proxyActivities or proxyLocalActivities call
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          (node.callee.name !== 'proxyActivities' &&
            node.callee.name !== 'proxyLocalActivities')
        ) {
          return;
        }

        // Get the options argument
        const optionsArg = node.arguments[0];

        // If no options provided, that's a separate issue (require-activity-timeouts)
        if (!optionsArg) {
          return;
        }

        // Check if options is an object literal
        if (optionsArg.type !== AST_NODE_TYPES.ObjectExpression) {
          // Can't statically analyze variable references
          return;
        }

        // Look for a retry property
        const hasRetryProperty = optionsArg.properties.some((prop) => {
          if (prop.type !== AST_NODE_TYPES.Property) {
            return false;
          }
          if (prop.key.type === AST_NODE_TYPES.Identifier) {
            return prop.key.name === 'retry';
          }
          if (prop.key.type === AST_NODE_TYPES.Literal) {
            return prop.key.value === 'retry';
          }
          return false;
        });

        if (!hasRetryProperty) {
          context.report({
            node,
            messageId: 'missingRetryPolicy',
          });
        }
      },
    };
  },
});
