import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'sinkNoReturnValue';

export const sinkNoReturnValue = createRule<[], MessageIds>({
  name: 'sink-no-return-value',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow using return values from sink calls. Sinks return void and their return values should not be used.',
    },
    messages: {
      sinkNoReturnValue:
        'Do not use the return value of sink calls. Sinks are fire-and-forget operations that return void. Any code that depends on a return value from a sink will not work as expected.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track variables that hold proxy sink references
    const sinkProxyVariables = new Set<string>();

    function isSinksMemberAccess(node: TSESTree.Node): boolean {
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

    function isSinkCall(node: TSESTree.CallExpression): boolean {
      return isSinksMemberAccess(node.callee);
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

      CallExpression(node) {
        if (!isSinkCall(node)) {
          return;
        }

        const parent = node.parent;
        if (!parent) {
          return;
        }

        // Check if the sink call is used in a context that expects a return value

        // Assignment (const x = sinks.logger.info())
        if (parent.type === AST_NODE_TYPES.VariableDeclarator && parent.init === node) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Assignment expression (x = sinks.logger.info())
        if (
          parent.type === AST_NODE_TYPES.AssignmentExpression &&
          parent.right === node
        ) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Return statement (return sinks.logger.info())
        if (parent.type === AST_NODE_TYPES.ReturnStatement) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Await expression (already covered by sink-no-await, but also catches return value usage)
        if (
          parent.type === AST_NODE_TYPES.AwaitExpression &&
          parent.parent?.type === AST_NODE_TYPES.VariableDeclarator
        ) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Used as argument to another function
        if (
          parent.type === AST_NODE_TYPES.CallExpression &&
          parent.arguments.includes(node)
        ) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Used in array/object
        if (
          parent.type === AST_NODE_TYPES.ArrayExpression ||
          (parent.type === AST_NODE_TYPES.Property && parent.value === node)
        ) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }

        // Used in conditional/logical expression
        if (
          parent.type === AST_NODE_TYPES.ConditionalExpression ||
          parent.type === AST_NODE_TYPES.LogicalExpression
        ) {
          context.report({
            node,
            messageId: 'sinkNoReturnValue',
          });
          return;
        }
      },
    };
  },
});
