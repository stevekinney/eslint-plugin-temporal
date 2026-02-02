import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createActivityRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'preferSingleObject';

type FunctionLike =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

export const preferSingleObjectActivityArgs = createActivityRule<[], MessageIds>({
  name: 'activity-prefer-single-object-args',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer a single object parameter for activities to keep signatures evolvable.',
    },
    messages: {
      preferSingleObject:
        'Prefer a single object parameter for activities. This activity has {{ count }} parameters.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checked = new Set<TSESTree.Node>();
    const functionMap = new Map<string, FunctionLike>();

    function shouldReport(params: TSESTree.Parameter[]): boolean {
      if (params.length > 1) return true;
      if (params.length === 1 && params[0]?.type === AST_NODE_TYPES.RestElement)
        return true;
      return false;
    }

    function checkFunction(node: FunctionLike): void {
      if (checked.has(node)) return;
      checked.add(node);

      if (!shouldReport(node.params)) return;

      context.report({
        node,
        messageId: 'preferSingleObject',
        data: { count: String(node.params.length) },
      });
    }

    function recordFunction(node: FunctionLike, name: string | null): void {
      if (!name) return;
      functionMap.set(name, node);
    }

    function handleExportedFunction(node: FunctionLike): void {
      checkFunction(node);
    }

    return {
      FunctionDeclaration(node) {
        if (node.id && node.parent?.type === AST_NODE_TYPES.Program) {
          recordFunction(node, node.id.name);
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;
        if (!node.init) return;
        if (
          node.init.type !== AST_NODE_TYPES.FunctionExpression &&
          node.init.type !== AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          return;
        }

        const isTopLevel = node.parent?.parent?.type === AST_NODE_TYPES.Program;
        const isExported =
          node.parent?.parent?.type === AST_NODE_TYPES.ExportNamedDeclaration;
        if (isTopLevel || isExported) {
          recordFunction(node.init, node.id.name);
        }
      },
      'ExportNamedDeclaration > FunctionDeclaration'(node: TSESTree.FunctionDeclaration) {
        handleExportedFunction(node);
      },
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression'(
        node: TSESTree.ArrowFunctionExpression,
      ) {
        handleExportedFunction(node);
      },
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression'(
        node: TSESTree.FunctionExpression,
      ) {
        handleExportedFunction(node);
      },
      ExportDefaultDeclaration(node) {
        const decl = node.declaration;
        if (
          decl.type === AST_NODE_TYPES.FunctionDeclaration ||
          decl.type === AST_NODE_TYPES.FunctionExpression ||
          decl.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          handleExportedFunction(decl);
          return;
        }

        if (decl.type === AST_NODE_TYPES.Identifier) {
          const mapped = functionMap.get(decl.name);
          if (mapped) {
            handleExportedFunction(mapped);
          }
        }
      },
      'Program:exit'(node: TSESTree.Program) {
        for (const statement of node.body) {
          if (statement.type !== AST_NODE_TYPES.ExportNamedDeclaration) continue;
          if (statement.declaration) continue;

          for (const specifier of statement.specifiers) {
            if (specifier.type !== AST_NODE_TYPES.ExportSpecifier) continue;
            if (specifier.local.type !== AST_NODE_TYPES.Identifier) continue;

            const mapped = functionMap.get(specifier.local.name);
            if (mapped) {
              handleExportedFunction(mapped);
            }
          }
        }
      },
    };
  },
});
