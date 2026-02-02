import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { isInsideFunction } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

const MESSAGE_DEFINITION_FUNCTIONS = new Set([
  'defineSignal',
  'defineQuery',
  'defineUpdate',
]);

type MessageIds = 'moduleScopeDefinitions';

export const requireMessageDefinitionsAtModuleScope = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-message-definitions-at-module-scope',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require defineSignal/defineQuery/defineUpdate calls to be declared at module scope so handler definitions remain stable across workflow runs.',
    },
    messages: {
      moduleScopeDefinitions:
        '{{ functionName }}() should be called at module scope (top level), not inside a function. Define message handlers once so they remain stable across workflow runs.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          !MESSAGE_DEFINITION_FUNCTIONS.has(node.callee.name)
        ) {
          return;
        }

        if (!isInsideFunction(node)) {
          return;
        }

        context.report({
          node,
          messageId: 'moduleScopeDefinitions',
          data: {
            functionName: node.callee.name,
          },
        });
      },
    };
  },
});
