import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noCryptoRandom';

const BANNED_METHODS = new Set(['randomBytes', 'getRandomValues', 'randomFillSync']);

export const noCryptoRandom = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-crypto-random',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow crypto.randomBytes(), crypto.getRandomValues(), and crypto.randomFillSync() in workflows. These produce non-deterministic output that breaks replay.',
    },
    messages: {
      noCryptoRandom:
        'Do not use crypto.{{ method }}() in workflows. It produces non-deterministic output that will differ on replay. Use a Temporal-safe alternative such as uuid4() for unique identifiers, or move random generation to an activity.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.object.type !== AST_NODE_TYPES.Identifier ||
          node.callee.object.name !== 'crypto' ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          !BANNED_METHODS.has(node.callee.property.name)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noCryptoRandom',
          data: {
            method: node.callee.property.name,
          },
        });
      },
    };
  },
});
