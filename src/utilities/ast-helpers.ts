import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Check if a node is an identifier with a specific name
 */
export function isIdentifier(
  node: TSESTree.Node | null | undefined,
  name?: string,
): node is TSESTree.Identifier {
  if (!node || node.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  if (name !== undefined) {
    return node.name === name;
  }
  return true;
}

/**
 * Check if a node is a member expression
 */
export function isMemberExpression(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.MemberExpression {
  return node?.type === AST_NODE_TYPES.MemberExpression;
}

/**
 * Check if a node is a call expression
 */
export function isCallExpression(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.CallExpression {
  return node?.type === AST_NODE_TYPES.CallExpression;
}

/**
 * Check if a node is a member expression with a specific object and property
 * e.g., `console.log` with object='console', property='log'
 */
export function isMemberExpressionMatch(
  node: TSESTree.Node | null | undefined,
  objectName: string,
  propertyName?: string,
): boolean {
  if (!isMemberExpression(node)) {
    return false;
  }

  if (!isIdentifier(node.object, objectName)) {
    return false;
  }

  if (propertyName !== undefined) {
    if (node.computed) {
      // node.property is a Literal or expression
      if (
        node.property.type === AST_NODE_TYPES.Literal &&
        node.property.value === propertyName
      ) {
        return true;
      }
      return false;
    }
    return isIdentifier(node.property, propertyName);
  }

  return true;
}

/**
 * Get the property name from a member expression
 */
export function getMemberExpressionProperty(
  node: TSESTree.MemberExpression,
): string | undefined {
  if (node.computed) {
    if (
      node.property.type === AST_NODE_TYPES.Literal &&
      typeof node.property.value === 'string'
    ) {
      return node.property.value;
    }
    return undefined;
  }

  if (isIdentifier(node.property)) {
    return node.property.name;
  }

  return undefined;
}

/**
 * Check if a node is inside a function (arrow, function expression, or declaration)
 */
export function isInsideFunction(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.FunctionDeclaration ||
      current.type === AST_NODE_TYPES.FunctionExpression ||
      current.type === AST_NODE_TYPES.ArrowFunctionExpression
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Check if a node is inside a loop
 */
export function isInsideLoop(node: TSESTree.Node): boolean {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ForStatement ||
      current.type === AST_NODE_TYPES.ForInStatement ||
      current.type === AST_NODE_TYPES.ForOfStatement ||
      current.type === AST_NODE_TYPES.WhileStatement ||
      current.type === AST_NODE_TYPES.DoWhileStatement
    ) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Get the enclosing loop node if any
 */
export function getEnclosingLoop(
  node: TSESTree.Node,
):
  | TSESTree.ForStatement
  | TSESTree.ForInStatement
  | TSESTree.ForOfStatement
  | TSESTree.WhileStatement
  | TSESTree.DoWhileStatement
  | undefined {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (
      current.type === AST_NODE_TYPES.ForStatement ||
      current.type === AST_NODE_TYPES.ForInStatement ||
      current.type === AST_NODE_TYPES.ForOfStatement ||
      current.type === AST_NODE_TYPES.WhileStatement ||
      current.type === AST_NODE_TYPES.DoWhileStatement
    ) {
      return current;
    }
    current = current.parent;
  }
  return undefined;
}

/**
 * Check if a node is an await expression
 */
export function isAwaitExpression(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.AwaitExpression {
  return node?.type === AST_NODE_TYPES.AwaitExpression;
}

/**
 * Check if a loop body contains an await expression
 */
export function loopContainsAwait(
  loop:
    | TSESTree.ForStatement
    | TSESTree.ForInStatement
    | TSESTree.ForOfStatement
    | TSESTree.WhileStatement
    | TSESTree.DoWhileStatement,
): boolean {
  const body = loop.body;
  return containsAwait(body);
}

// Keys to skip during AST traversal (circular references)
const SKIP_KEYS = new Set(['parent', 'range', 'loc', 'tokens', 'comments']);

function containsAwait(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return true;
  }

  // Don't traverse into nested functions
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  // Traverse children (skip circular references)
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;

    const child = (node as unknown as Record<string, unknown>)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            if (containsAwait(item as TSESTree.Node)) {
              return true;
            }
          }
        }
      } else if ('type' in child) {
        if (containsAwait(child as TSESTree.Node)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a node is a throw statement
 */
export function isThrowStatement(
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ThrowStatement {
  return node?.type === AST_NODE_TYPES.ThrowStatement;
}

/**
 * Check if an expression is a new Error() call
 */
export function isNewError(node: TSESTree.Expression): boolean {
  if (node.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }

  // Check for `new Error(...)` or `new TypeError(...)` etc.
  if (isIdentifier(node.callee)) {
    const errorTypes = [
      'Error',
      'TypeError',
      'RangeError',
      'ReferenceError',
      'SyntaxError',
      'URIError',
      'EvalError',
    ];
    return errorTypes.includes(node.callee.name);
  }

  return false;
}

/**
 * Get the string value of a node if it's a string literal
 */
export function getStringValue(
  node: TSESTree.Node | null | undefined,
): string | undefined {
  if (!node) return undefined;

  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return node.value;
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral && node.quasis.length === 1) {
    return node.quasis[0]?.value.cooked ?? undefined;
  }

  return undefined;
}

/**
 * Check if a property exists in an object expression
 */
export function hasProperty(
  node: TSESTree.ObjectExpression,
  propertyName: string,
): boolean {
  return node.properties.some((prop) => {
    if (prop.type !== AST_NODE_TYPES.Property) return false;
    if (isIdentifier(prop.key, propertyName)) return true;
    if (prop.key.type === AST_NODE_TYPES.Literal && prop.key.value === propertyName) {
      return true;
    }
    return false;
  });
}

/**
 * Get a property value from an object expression
 */
export function getProperty(
  node: TSESTree.ObjectExpression,
  propertyName: string,
): TSESTree.Property | undefined {
  for (const prop of node.properties) {
    if (prop.type !== AST_NODE_TYPES.Property) continue;
    if (isIdentifier(prop.key, propertyName)) return prop;
    if (prop.key.type === AST_NODE_TYPES.Literal && prop.key.value === propertyName) {
      return prop;
    }
  }
  return undefined;
}
