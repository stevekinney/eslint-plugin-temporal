import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'dateNowTightLoop';

export const noDateNowTightLoop = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-date-now-tight-loop',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when Date.now() is called multiple times without yielding in workflow code.',
    },
    messages: {
      dateNowTightLoop:
        'Date.now() does not advance within the same workflow task. Multiple calls without awaiting a timer can lead to incorrect assumptions. Use a timer/condition between reads or reuse the first value.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function isDateNowCall(node: TSESTree.Node): node is TSESTree.CallExpression {
      if (node.type !== AST_NODE_TYPES.CallExpression) return false;
      const { callee } = node;
      if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      if (callee.object.type !== AST_NODE_TYPES.Identifier) return false;
      if (callee.object.name !== 'Date') return false;

      if (callee.property.type === AST_NODE_TYPES.Identifier) {
        return callee.property.name === 'now';
      }

      return (
        callee.property.type === AST_NODE_TYPES.Literal && callee.property.value === 'now'
      );
    }

    function isFunctionLike(node: TSESTree.Node): boolean {
      return (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.ClassDeclaration ||
        node.type === AST_NODE_TYPES.ClassExpression
      );
    }

    function collectDateNowCalls(node: TSESTree.Node, calls: TSESTree.CallExpression[]) {
      if (isFunctionLike(node)) return;
      if (isDateNowCall(node)) {
        calls.push(node);
        return;
      }

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              collectDateNowCalls(child as TSESTree.Node, calls);
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          collectDateNowCalls(value as TSESTree.Node, calls);
        }
      }
    }

    function containsAwait(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.AwaitExpression) return true;
      if (isFunctionLike(node)) return false;

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              if (containsAwait(child as TSESTree.Node)) return true;
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (containsAwait(value as TSESTree.Node)) return true;
        }
      }

      return false;
    }

    function checkStatements(statements: TSESTree.Statement[]): void {
      let sawDateNow = false;

      for (const statement of statements) {
        const calls: TSESTree.CallExpression[] = [];
        collectDateNowCalls(statement, calls);
        const hasAwait = containsAwait(statement);

        if (!hasAwait && calls.length > 0) {
          const startIndex = sawDateNow ? 0 : 1;
          for (const call of calls.slice(startIndex)) {
            context.report({ node: call, messageId: 'dateNowTightLoop' });
          }
          sawDateNow = true;
        }

        if (hasAwait) {
          sawDateNow = false;
        }
      }
    }

    return {
      Program(node) {
        checkStatements(node.body);
      },
      FunctionDeclaration(node) {
        if (node.body?.type === AST_NODE_TYPES.BlockStatement) {
          checkStatements(node.body.body);
        }
      },
      FunctionExpression(node) {
        if (node.body.type === AST_NODE_TYPES.BlockStatement) {
          checkStatements(node.body.body);
        }
      },
      ArrowFunctionExpression(node) {
        if (node.body.type === AST_NODE_TYPES.BlockStatement) {
          checkStatements(node.body.body);
        }
      },
    };
  },
});
