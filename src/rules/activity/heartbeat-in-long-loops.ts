import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { loopContainsAwait } from '../../utilities/ast-helpers.ts';
import { createActivityRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'missingHeartbeat';

export const heartbeatInLongLoops = createActivityRule<[], MessageIds>({
  name: 'activity-heartbeat-in-long-loops',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest calling heartbeat() in loops that contain await expressions.',
    },
    messages: {
      missingHeartbeat:
        'This loop contains async operations but no heartbeat() call. For long-running activities, call Context.current().heartbeat() periodically to report progress and detect cancellation. Without heartbeats, cancelled activities may continue running.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkLoop(
      node:
        | TSESTree.ForStatement
        | TSESTree.ForInStatement
        | TSESTree.ForOfStatement
        | TSESTree.WhileStatement
        | TSESTree.DoWhileStatement,
    ) {
      // Check if loop contains await
      if (!loopContainsAwait(node)) {
        return;
      }

      // Check if loop contains heartbeat call
      if (containsHeartbeat(node.body)) {
        return;
      }

      context.report({
        node,
        messageId: 'missingHeartbeat',
      });
    }

    return {
      ForStatement: checkLoop,
      ForInStatement: checkLoop,
      ForOfStatement: checkLoop,
      WhileStatement: checkLoop,
      DoWhileStatement: checkLoop,
    };
  },
});

// Keys to skip during AST traversal (circular references)
const SKIP_KEYS = new Set(['parent', 'range', 'loc', 'tokens', 'comments']);

/**
 * Check if a node contains a heartbeat() call
 */
function containsHeartbeat(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    // Check for heartbeat() or Context.current().heartbeat()
    if (isHeartbeatCall(node)) {
      return true;
    }
  }

  // Don't traverse into nested functions (they have their own scope)
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
            if (containsHeartbeat(item as TSESTree.Node)) {
              return true;
            }
          }
        }
      } else if ('type' in child) {
        if (containsHeartbeat(child as TSESTree.Node)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if a call expression is a heartbeat call
 */
function isHeartbeatCall(node: TSESTree.CallExpression): boolean {
  const { callee } = node;

  // Direct call: heartbeat()
  if (callee.type === AST_NODE_TYPES.Identifier && callee.name === 'heartbeat') {
    return true;
  }

  // Member expression: context.heartbeat() or Context.current().heartbeat()
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    const { property } = callee;

    if (property.type === AST_NODE_TYPES.Identifier && property.name === 'heartbeat') {
      return true;
    }
  }

  return false;
}
