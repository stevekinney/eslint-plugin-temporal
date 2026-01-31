import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

/**
 * Types of Temporal handlers
 */
export type HandlerType = 'query' | 'signal' | 'update' | 'unknown';

/**
 * The define* functions that create handler definitions
 */
export const HANDLER_DEFINITION_FUNCTIONS = {
  defineQuery: 'query',
  defineSignal: 'signal',
  defineUpdate: 'update',
} as const;

/**
 * Check if a call is to setHandler
 */
export function isSetHandlerCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type !== AST_NODE_TYPES.Identifier) {
    return false;
  }
  return node.callee.name === 'setHandler';
}

/**
 * Determine the handler type from a setHandler call
 * Returns 'unknown' if the type cannot be determined
 */
export function getHandlerType(
  node: TSESTree.CallExpression,
  definitionMap: Map<string, HandlerType>,
): HandlerType {
  // First argument to setHandler is the definition (from defineQuery, etc.)
  const definitionArg = node.arguments[0];
  if (!definitionArg) {
    return 'unknown';
  }

  // If it's an identifier, look it up in our map
  if (definitionArg.type === AST_NODE_TYPES.Identifier) {
    return definitionMap.get(definitionArg.name) ?? 'unknown';
  }

  // If it's a call expression inline, check the function name
  if (definitionArg.type === AST_NODE_TYPES.CallExpression) {
    if (definitionArg.callee.type === AST_NODE_TYPES.Identifier) {
      const funcName = definitionArg.callee
        .name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
      if (funcName in HANDLER_DEFINITION_FUNCTIONS) {
        return HANDLER_DEFINITION_FUNCTIONS[funcName];
      }
    }
  }

  return 'unknown';
}

/**
 * Get the handler callback function from a setHandler call
 * Returns undefined if the callback cannot be found
 */
export function getHandlerCallback(
  node: TSESTree.CallExpression,
):
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | TSESTree.Identifier
  | undefined {
  // Second argument to setHandler is the callback
  const callbackArg = node.arguments[1];
  if (!callbackArg) {
    return undefined;
  }

  if (
    callbackArg.type === AST_NODE_TYPES.FunctionExpression ||
    callbackArg.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    callbackArg.type === AST_NODE_TYPES.Identifier
  ) {
    return callbackArg;
  }

  return undefined;
}

/**
 * Check if a function is async
 */
export function isAsyncFunction(
  node:
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration,
): boolean {
  return node.async;
}

/**
 * Check if a function has a return statement with a value
 */
export function hasReturnValue(
  node:
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration,
): boolean {
  // For arrow functions with expression body, it implicitly returns
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.expression) {
    // Check if the body is not void/undefined
    const body = node.body;
    if (body.type === AST_NODE_TYPES.Identifier && body.name === 'undefined') {
      return false;
    }
    if (body.type === AST_NODE_TYPES.UnaryExpression && body.operator === 'void') {
      return false;
    }
    return true;
  }

  // For block body functions, look for return statements
  if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }

  return containsReturnWithValue(node.body);
}

/**
 * Recursively check if a node contains a return statement with a value
 */
function containsReturnWithValue(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.ReturnStatement) {
    // Return with an argument
    if (node.argument) {
      // Check if returning undefined/void
      if (
        node.argument.type === AST_NODE_TYPES.Identifier &&
        node.argument.name === 'undefined'
      ) {
        return false;
      }
      if (
        node.argument.type === AST_NODE_TYPES.UnaryExpression &&
        node.argument.operator === 'void'
      ) {
        return false;
      }
      return true;
    }
    return false;
  }

  // Don't traverse into nested functions
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  // Check all child nodes
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          containsReturnWithValue(item as TSESTree.Node)
        ) {
          return true;
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsReturnWithValue(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Collect all local variable names from a block statement
 */
function collectLocalVariables(node: TSESTree.Node, localVars: Set<string>): void {
  if (node.type === AST_NODE_TYPES.VariableDeclaration) {
    for (const decl of node.declarations) {
      if (decl.id.type === AST_NODE_TYPES.Identifier) {
        localVars.add(decl.id.name);
      }
    }
  }

  // Don't traverse into nested functions
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return;
  }

  // Check all child nodes
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'type' in item) {
          collectLocalVariables(item as TSESTree.Node, localVars);
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      collectLocalVariables(value as TSESTree.Node, localVars);
    }
  }
}

/**
 * Check if a node contains any state mutations (assignments to variables)
 * This is used to detect mutations in query handlers
 */
export function containsMutation(
  node: TSESTree.Node,
  excludeLocalVariables: Set<string> = new Set(),
): boolean {
  // First pass: collect all local variable declarations
  const localVars = new Set(excludeLocalVariables);
  collectLocalVariables(node, localVars);

  // Second pass: check for mutations to non-local variables
  return checkMutations(node, localVars);
}

/**
 * Check for mutations in a node
 */
function checkMutations(node: TSESTree.Node, localVars: Set<string>): boolean {
  // Assignment expressions
  if (node.type === AST_NODE_TYPES.AssignmentExpression) {
    // Check if assigning to a local variable (which is fine)
    if (node.left.type === AST_NODE_TYPES.Identifier) {
      if (!localVars.has(node.left.name)) {
        return true;
      }
    } else {
      // Assignment to member expression or other complex target
      return true;
    }
  }

  // Update expressions (++, --)
  if (node.type === AST_NODE_TYPES.UpdateExpression) {
    if (node.argument.type === AST_NODE_TYPES.Identifier) {
      if (!localVars.has(node.argument.name)) {
        return true;
      }
    } else {
      return true;
    }
  }

  // Don't traverse into nested functions
  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    return false;
  }

  // Check all child nodes
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') {
      continue;
    }

    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item &&
          typeof item === 'object' &&
          'type' in item &&
          checkMutations(item as TSESTree.Node, localVars)
        ) {
          return true;
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (checkMutations(value as TSESTree.Node, localVars)) {
        return true;
      }
    }
  }

  return false;
}
