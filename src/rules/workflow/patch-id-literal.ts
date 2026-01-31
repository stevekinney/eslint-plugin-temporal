import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'patchIdMustBeLiteral';

export const patchIdLiteral = createRule<[], MessageIds>({
  name: 'patch-id-literal',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require patch IDs to be string literals for traceability and determinism.',
    },
    messages: {
      patchIdMustBeLiteral:
        'Patch IDs must be string literals, not variables or expressions. Patch IDs are used for workflow versioning and must be deterministic across replays. Use a descriptive literal like `patched("my-feature-v2")`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        // Check for patched() or deprecatePatch() calls
        if (node.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const { name } = node.callee;
        if (name !== 'patched' && name !== 'deprecatePatch') {
          return;
        }

        // First argument should be the patch ID
        const patchIdArg = node.arguments[0];
        if (!patchIdArg) {
          return;
        }

        // Check if it's a string literal
        if (
          patchIdArg.type === AST_NODE_TYPES.Literal &&
          typeof patchIdArg.value === 'string'
        ) {
          return; // Valid
        }

        // Template literal with no expressions is also acceptable
        if (
          patchIdArg.type === AST_NODE_TYPES.TemplateLiteral &&
          patchIdArg.expressions.length === 0
        ) {
          return; // Valid
        }

        // Everything else is invalid
        context.report({
          node: patchIdArg,
          messageId: 'patchIdMustBeLiteral',
        });
      },
    };
  },
});
