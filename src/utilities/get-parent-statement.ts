import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Statement types that can have comments attached above them.
 */
const STATEMENT_TYPES = new Set<string>([
  AST_NODE_TYPES.ExpressionStatement,
  AST_NODE_TYPES.VariableDeclaration,
  AST_NODE_TYPES.ReturnStatement,
  AST_NODE_TYPES.IfStatement,
  AST_NODE_TYPES.ThrowStatement,
  AST_NODE_TYPES.BlockStatement,
]);

/**
 * Get the parent statement node for a given node.
 * This is useful for inserting comments above the statement containing an expression.
 *
 * @param node - The node to find the parent statement for
 * @returns The parent statement node, or the node itself if it's already a statement
 */
export function getParentStatement(node: TSESTree.Node): TSESTree.Node {
  let current: TSESTree.Node | undefined = node;

  while (current) {
    if (STATEMENT_TYPES.has(current.type)) {
      return current;
    }
    current = current.parent;
  }

  // Fallback to the original node if no statement found
  return node;
}

/**
 * Get the indentation string for a node based on its column position.
 *
 * @param node - The node to get indentation for
 * @returns A string of spaces matching the node's indentation
 */
export function getIndentation(node: TSESTree.Node): string {
  if (!node.loc) return '';
  return ' '.repeat(node.loc.start.column);
}
