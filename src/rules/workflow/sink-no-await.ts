import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'sinkNoAwait';

export const sinkNoAwait = createRule<[], MessageIds>({
  name: 'sink-no-await',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow awaiting sink calls. Sinks are fire-and-forget and return void - awaiting them is a mistake.',
    },
    messages: {
      sinkNoAwait:
        'Do not await sink calls. Sinks are fire-and-forget operations that return void immediately. The sink function will be invoked but the result cannot be awaited. Remove the await keyword.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track variables that hold proxy sink references
    const sinkProxyVariables = new Set<string>();

    function isSinksMemberAccess(node: TSESTree.Node): boolean {
      // Check for patterns like: sinks.myLogger.info()
      // where sinks is a proxy created by proxySinks()
      if (node.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
      }

      // Check if the object is a known sink proxy
      if (node.object.type === AST_NODE_TYPES.Identifier) {
        return sinkProxyVariables.has(node.object.name);
      }

      // Check for nested access (sinks.myLogger.info)
      if (node.object.type === AST_NODE_TYPES.MemberExpression) {
        if (node.object.object.type === AST_NODE_TYPES.Identifier) {
          return sinkProxyVariables.has(node.object.object.name);
        }
      }

      return false;
    }

    return {
      // Track proxySinks() variable assignments
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
          node.init.callee.name === 'proxySinks'
        ) {
          sinkProxyVariables.add(node.id.name);
        }
      },

      AwaitExpression(node) {
        // Check if awaiting a call expression
        if (node.argument.type !== AST_NODE_TYPES.CallExpression) {
          return;
        }

        const call = node.argument;

        // Check if the call is to a sink method
        if (isSinksMemberAccess(call.callee)) {
          context.report({
            node,
            messageId: 'sinkNoAwait',
          });
        }
      },
    };
  },
});
