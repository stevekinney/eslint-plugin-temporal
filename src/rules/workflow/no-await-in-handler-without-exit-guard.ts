import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

type MessageIds = 'missingExitGuard';

type FunctionLike =
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration;

function containsAllHandlersFinishedReference(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.Identifier && node.name === 'allHandlersFinished') {
    return true;
  }

  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'allHandlersFinished'
  ) {
    return true;
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') continue;
    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'type' in item) {
          if (containsAllHandlersFinishedReference(item as TSESTree.Node)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAllHandlersFinishedReference(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

function containsAllHandlersFinishedCheck(node: TSESTree.Node): boolean {
  if (
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.callee.name === 'condition'
  ) {
    for (const arg of node.arguments) {
      if (containsAllHandlersFinishedReference(arg)) {
        return true;
      }
    }
  }

  if (
    node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      if (containsAllHandlersFinishedReference(node.body)) {
        return true;
      }
    }
    return false;
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'range' || key === 'loc') continue;
    const value = (node as unknown as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object' && 'type' in item) {
          if (containsAllHandlersFinishedCheck(item as TSESTree.Node)) {
            return true;
          }
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      if (containsAllHandlersFinishedCheck(value as TSESTree.Node)) {
        return true;
      }
    }
  }

  return false;
}

export const noAwaitInHandlerWithoutExitGuard = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-await-in-handler-without-exit-guard',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require workflows with async signal/update handlers that await work to use condition(allHandlersFinished) before exiting.',
    },
    messages: {
      missingExitGuard:
        'This handler awaits work. Ensure the workflow awaits condition(allHandlersFinished) before returning or continuing-as-new to avoid cutting off in-flight handlers.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const handlerDefinitions = new Map<string, HandlerType>();
    const handlersWithAwait: TSESTree.Node[] = [];
    const sourceCode = context.sourceCode;

    let hasAllHandlersFinishedCheck = false;
    let workflowFunctionNode: FunctionLike | null = null;

    function containsAwait(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.AwaitExpression) {
        return true;
      }

      if (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression
      ) {
        return false;
      }

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        if (key === 'parent' || key === 'range' || key === 'loc') continue;
        const value = (node as unknown as Record<string, unknown>)[key];

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              if (containsAwait(item as TSESTree.Node)) {
                return true;
              }
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (containsAwait(value as TSESTree.Node)) {
            return true;
          }
        }
      }

      return false;
    }

    function trackWorkflowFunction(node: FunctionLike): void {
      if (!node.async) return;
      workflowFunctionNode = node;
    }

    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          node.init.type !== AST_NODE_TYPES.CallExpression
        ) {
          return;
        }

        const call = node.init;
        if (call.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const funcName = call.callee.name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
        if (funcName in HANDLER_DEFINITION_FUNCTIONS) {
          handlerDefinitions.set(node.id.name, HANDLER_DEFINITION_FUNCTIONS[funcName]);
        }
      },

      CallExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'condition'
        ) {
          for (const arg of node.arguments) {
            if (containsAllHandlersFinishedReference(arg)) {
              hasAllHandlersFinishedCheck = true;
            }
          }
        }

        if (!isSetHandlerCall(node)) {
          return;
        }

        const handlerType = getHandlerType(node, handlerDefinitions);
        if (handlerType !== 'signal' && handlerType !== 'update') {
          return;
        }

        const callback = getHandlerCallback(node);
        if (!callback || callback.type === AST_NODE_TYPES.Identifier) {
          return;
        }

        if (containsAwait(callback.body)) {
          handlersWithAwait.push(callback);
        }
      },

      'ExportNamedDeclaration > FunctionDeclaration'(node: TSESTree.FunctionDeclaration) {
        trackWorkflowFunction(node);
      },

      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression'(
        node: TSESTree.ArrowFunctionExpression,
      ) {
        trackWorkflowFunction(node);
      },

      'Program:exit'() {
        if (!handlersWithAwait.length) {
          return;
        }

        if (hasAllHandlersFinishedCheck) {
          return;
        }

        if (
          workflowFunctionNode &&
          containsAllHandlersFinishedCheck(workflowFunctionNode.body)
        ) {
          return;
        }

        for (const handler of handlersWithAwait) {
          context.report({
            node: handler,
            messageId: 'missingExitGuard',
          });
        }
      },
    };
  },
});
