import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';

export function getTypeName(typeName: TSESTree.EntityName): string | null {
  if (typeName.type === AST_NODE_TYPES.Identifier) {
    return typeName.name;
  }
  if (typeName.type === AST_NODE_TYPES.TSQualifiedName) {
    return typeName.right.name;
  }
  return null;
}

export function collectParamTypeAnnotations(
  param: TSESTree.Parameter,
): TSESTree.TSTypeAnnotation[] {
  const annotations: TSESTree.TSTypeAnnotation[] = [];

  if ('typeAnnotation' in param && param.typeAnnotation) {
    annotations.push(param.typeAnnotation);
  }

  if (param.type === AST_NODE_TYPES.RestElement) {
    const arg = param.argument;
    if ('typeAnnotation' in arg && arg.typeAnnotation) {
      annotations.push(arg.typeAnnotation);
    }
  }

  if (param.type === AST_NODE_TYPES.AssignmentPattern) {
    annotations.push(...collectParamTypeAnnotations(param.left));
  }

  return annotations;
}

export function walkTypeNodes(
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
  visit: (node: TSESTree.Node) => void,
  visited = new Set<TSESTree.Node>(),
): void {
  if (visited.has(node)) return;
  visited.add(node);

  visit(node);

  const keys = sourceCode.visitorKeys[node.type] ?? [];
  for (const key of keys) {
    if (key === 'parent' || key === 'range' || key === 'loc') continue;
    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'type' in item) {
          walkTypeNodes(item as TSESTree.Node, sourceCode, visit, visited);
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      walkTypeNodes(value as TSESTree.Node, sourceCode, visit, visited);
    }
  }
}
