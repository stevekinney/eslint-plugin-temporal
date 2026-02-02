import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'sinkArgsMustBeCloneable';

export const sinkArgsMustBeCloneable = createWorkflowRule<[], MessageIds>({
  name: 'workflow-sink-args-must-be-cloneable',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require sink call arguments to be cloneable data (no functions, class instances, or Errors).',
    },
    messages: {
      sinkArgsMustBeCloneable:
        'Sink arguments must be cloneable data. Avoid passing functions, class instances, or Error objects to sinks. Use plain objects/arrays instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const sinkProxyVariables = new Set<string>();
    const nonCloneableIdentifiers = new Set<string>();
    let scanned = false;

    function isProxySinksCall(node: TSESTree.Node): boolean {
      return (
        node.type === AST_NODE_TYPES.CallExpression &&
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === 'proxySinks'
      );
    }

    function isAllowedConstructor(node: TSESTree.NewExpression): boolean {
      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return node.callee.name === 'Array' || node.callee.name === 'Object';
      }
      return false;
    }

    function unwrapExpression(node: TSESTree.Node): TSESTree.Node {
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

    function isDirectNonCloneable(
      node: TSESTree.Node,
      checkIdentifiers: boolean,
    ): boolean {
      switch (node.type) {
        case AST_NODE_TYPES.FunctionExpression:
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.ClassExpression:
          return true;
        case AST_NODE_TYPES.NewExpression:
          return !isAllowedConstructor(node);
        case AST_NODE_TYPES.Identifier:
          return checkIdentifiers && nonCloneableIdentifiers.has(node.name);
        default:
          return false;
      }
    }

    function containsNonCloneable(
      node: TSESTree.Node,
      checkIdentifiers: boolean,
      visited = new Set<TSESTree.Node>(),
    ): boolean {
      const target = unwrapExpression(node);
      if (visited.has(target)) return false;
      visited.add(target);

      if (isDirectNonCloneable(target, checkIdentifiers)) {
        return true;
      }

      if (
        target.type === AST_NODE_TYPES.CallExpression ||
        target.type === AST_NODE_TYPES.AwaitExpression
      ) {
        return false;
      }

      const keys = sourceCode.visitorKeys[target.type] ?? [];
      for (const key of keys) {
        if (key === 'parent' || key === 'range' || key === 'loc') continue;
        const value = (target as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              if (
                containsNonCloneable(child as TSESTree.Node, checkIdentifiers, visited)
              ) {
                return true;
              }
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (containsNonCloneable(value as TSESTree.Node, checkIdentifiers, visited)) {
            return true;
          }
        }
      }

      return false;
    }

    function scanProgram(): void {
      if (scanned) return;
      scanned = true;

      const visit = (node: TSESTree.Node): void => {
        if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
          nonCloneableIdentifiers.add(node.id.name);
        }

        if (node.type === AST_NODE_TYPES.ClassDeclaration && node.id) {
          nonCloneableIdentifiers.add(node.id.name);
        }

        if (
          node.type === AST_NODE_TYPES.VariableDeclarator &&
          node.id.type === AST_NODE_TYPES.Identifier &&
          node.init
        ) {
          if (isProxySinksCall(node.init)) {
            sinkProxyVariables.add(node.id.name);
          }

          if (containsNonCloneable(node.init, false)) {
            nonCloneableIdentifiers.add(node.id.name);
          }
        }

        const keys = sourceCode.visitorKeys[node.type] ?? [];
        for (const key of keys) {
          if (key === 'parent' || key === 'range' || key === 'loc') continue;
          const value = (node as unknown as Record<string, unknown>)[key];
          if (!value) continue;

          if (Array.isArray(value)) {
            for (const child of value) {
              if (child && typeof child === 'object' && 'type' in child) {
                visit(child as TSESTree.Node);
              }
            }
          } else if (value && typeof value === 'object' && 'type' in value) {
            visit(value as TSESTree.Node);
          }
        }
      };

      visit(sourceCode.ast);
    }

    function isSinksMemberAccess(node: TSESTree.Node): boolean {
      if (node.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
      }

      let current: TSESTree.Node = node;
      while (current.type === AST_NODE_TYPES.MemberExpression) {
        if (
          current.object.type === AST_NODE_TYPES.Identifier &&
          sinkProxyVariables.has(current.object.name)
        ) {
          return true;
        }
        current = current.object;
      }

      return false;
    }

    function isSinkCall(node: TSESTree.CallExpression): boolean {
      return isSinksMemberAccess(node.callee);
    }

    return {
      CallExpression(node) {
        scanProgram();

        if (!isSinkCall(node)) {
          return;
        }

        for (const arg of node.arguments) {
          if (containsNonCloneable(arg, true)) {
            context.report({
              node: arg,
              messageId: 'sinkArgsMustBeCloneable',
            });
          }
        }
      },
    };
  },
});
