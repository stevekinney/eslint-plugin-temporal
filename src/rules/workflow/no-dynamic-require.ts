import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noDynamicRequire';

export const noDynamicRequire = createRule<[], MessageIds>({
  name: 'no-dynamic-require',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow require() calls in workflows. require() is not deterministic because it can load different modules based on runtime conditions.',
    },
    messages: {
      noDynamicRequire:
        'Do not use require() in workflows. The require function can introduce non-determinism because module resolution depends on the file system and runtime environment. Use ES module imports (import ... from) instead, which are statically analyzable and bundled deterministically.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a require() call
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'require'
        ) {
          context.report({
            node,
            messageId: 'noDynamicRequire',
          });
        }
      },
    };
  },
});
