import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'setHandlerAfterAwait';

export const requireSetHandlerEarly = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-set-handler-early',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require setHandler calls before the first await in workflow functions. This ensures handlers are registered before any async operations.',
    },
    messages: {
      setHandlerAfterAwait:
        'setHandler() should be called before any await expressions in the workflow. Handlers registered after an await may miss signals/queries/updates sent before the await completed. Move this setHandler call to the beginning of the workflow function.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track function scopes and their first await position
    interface FunctionScope {
      hasAwait: boolean;
      firstAwaitNode: TSESTree.AwaitExpression | null;
      setHandlerAfterAwait: TSESTree.CallExpression[];
    }

    const functionScopes: FunctionScope[] = [];

    function enterFunction() {
      functionScopes.push({
        hasAwait: false,
        firstAwaitNode: null,
        setHandlerAfterAwait: [],
      });
    }

    function exitFunction() {
      const scope = functionScopes.pop();
      if (!scope) return;

      // Report all setHandler calls that came after the first await
      for (const node of scope.setHandlerAfterAwait) {
        context.report({
          node,
          messageId: 'setHandlerAfterAwait',
        });
      }
    }

    function getCurrentScope(): FunctionScope | undefined {
      return functionScopes[functionScopes.length - 1];
    }

    return {
      // Track function entry/exit
      FunctionDeclaration: enterFunction,
      'FunctionDeclaration:exit': exitFunction,
      FunctionExpression: enterFunction,
      'FunctionExpression:exit': exitFunction,
      ArrowFunctionExpression: enterFunction,
      'ArrowFunctionExpression:exit': exitFunction,

      AwaitExpression(node) {
        const scope = getCurrentScope();
        if (!scope) return;

        if (!scope.hasAwait) {
          scope.hasAwait = true;
          scope.firstAwaitNode = node;
        }
      },

      CallExpression(node) {
        // Check if this is a setHandler call
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'setHandler'
        ) {
          return;
        }

        const scope = getCurrentScope();
        if (!scope) return;

        // If we've already seen an await in this scope, flag this setHandler
        if (scope.hasAwait) {
          scope.setHandlerAfterAwait.push(node);
        }
      },
    };
  },
});
