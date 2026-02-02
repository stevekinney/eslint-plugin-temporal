import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

export type FunctionLike =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

function isFunctionLike(node: TSESTree.Node): node is FunctionLike {
  return (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  );
}

function recordVariableDeclarators(
  node: TSESTree.VariableDeclaration,
  map: Map<string, FunctionLike>,
): void {
  for (const declarator of node.declarations) {
    if (declarator.id.type !== AST_NODE_TYPES.Identifier) continue;
    if (!declarator.init) continue;
    if (!isFunctionLike(declarator.init)) continue;

    map.set(declarator.id.name, declarator.init);
  }
}

export function findExportedFunctions(program: TSESTree.Program): FunctionLike[] {
  const functionMap = new Map<string, FunctionLike>();

  for (const statement of program.body) {
    if (
      statement.type === AST_NODE_TYPES.FunctionDeclaration &&
      statement.id &&
      statement.parent?.type === AST_NODE_TYPES.Program
    ) {
      functionMap.set(statement.id.name, statement);
      continue;
    }

    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      recordVariableDeclarators(statement, functionMap);
      continue;
    }

    if (
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
      statement.declaration
    ) {
      const decl = statement.declaration;
      if (decl.type === AST_NODE_TYPES.FunctionDeclaration && decl.id) {
        functionMap.set(decl.id.name, decl);
        continue;
      }

      if (decl.type === AST_NODE_TYPES.VariableDeclaration) {
        recordVariableDeclarators(decl, functionMap);
      }
    }
  }

  const exported = new Set<FunctionLike>();

  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
      if (statement.declaration) {
        const decl = statement.declaration;
        if (isFunctionLike(decl)) {
          exported.add(decl);
        } else if (decl.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const declarator of decl.declarations) {
            if (
              declarator.id.type !== AST_NODE_TYPES.Identifier ||
              !declarator.init ||
              !isFunctionLike(declarator.init)
            ) {
              continue;
            }
            exported.add(declarator.init);
          }
        }
        continue;
      }

      for (const specifier of statement.specifiers) {
        if (specifier.type !== AST_NODE_TYPES.ExportSpecifier) continue;
        if (specifier.local.type !== AST_NODE_TYPES.Identifier) continue;
        const mapped = functionMap.get(specifier.local.name);
        if (mapped) {
          exported.add(mapped);
        }
      }
    }

    if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
      const decl = statement.declaration;
      if (isFunctionLike(decl)) {
        exported.add(decl);
        continue;
      }

      if (decl.type === AST_NODE_TYPES.Identifier) {
        const mapped = functionMap.get(decl.name);
        if (mapped) {
          exported.add(mapped);
        }
      }
    }
  }

  return [...exported];
}
