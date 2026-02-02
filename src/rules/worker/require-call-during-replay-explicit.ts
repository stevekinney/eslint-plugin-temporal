import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getProperty, hasProperty } from '../../utilities/ast-helpers.ts';
import { createWorkerRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'callDuringReplayExplicit';

function isSinksProperty(node: TSESTree.Property): boolean {
  if (node.key.type === AST_NODE_TYPES.Identifier) {
    return node.key.name === 'sinks';
  }
  if (node.key.type === AST_NODE_TYPES.Literal) {
    return node.key.value === 'sinks';
  }
  return false;
}

function collectSinkFunctionObjects(
  node: TSESTree.ObjectExpression,
  results: TSESTree.ObjectExpression[],
): void {
  if (hasProperty(node, 'fn')) {
    results.push(node);
  }

  for (const prop of node.properties) {
    if (prop.type !== AST_NODE_TYPES.Property) continue;
    if (prop.value.type === AST_NODE_TYPES.ObjectExpression) {
      collectSinkFunctionObjects(prop.value, results);
    }
  }
}

export const requireCallDuringReplayExplicit = createWorkerRule<[], MessageIds>({
  name: 'worker-require-call-during-replay-explicit',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit callDuringReplay configuration for each sink function.',
    },
    messages: {
      callDuringReplayExplicit:
        'Explicitly set callDuringReplay for each sink function to avoid replay behavior surprises.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node) {
        if (!isSinksProperty(node)) return;
        if (node.value.type !== AST_NODE_TYPES.ObjectExpression) return;

        const sinkFunctionObjects: TSESTree.ObjectExpression[] = [];
        collectSinkFunctionObjects(node.value, sinkFunctionObjects);

        for (const sinkObject of sinkFunctionObjects) {
          if (!hasProperty(sinkObject, 'callDuringReplay')) {
            const fnProp = getProperty(sinkObject, 'fn');
            context.report({
              node: fnProp ?? sinkObject,
              messageId: 'callDuringReplayExplicit',
            });
          }
        }
      },
    };
  },
});
