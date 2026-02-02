import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'duplicatePatchId';

export const noDuplicatePatchIds = createRule<[], MessageIds>({
  name: 'no-duplicate-patch-ids',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow duplicate patch IDs within a file. Duplicate patch IDs cause unpredictable versioning behavior.',
    },
    messages: {
      duplicatePatchId:
        "Duplicate patch ID '{{ patchId }}'. Patch IDs must be unique within a workflow to ensure correct versioning behavior. Each patched() or deprecatePatch() call should have a distinct ID.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track patch IDs seen in this file
    const patchIds = new Map<string, { node: unknown; line: number }>();

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

        // Only check string literals (other patterns are caught by patch-id-literal)
        let patchId: string | undefined;

        if (
          patchIdArg.type === AST_NODE_TYPES.Literal &&
          typeof patchIdArg.value === 'string'
        ) {
          patchId = patchIdArg.value;
        } else if (
          patchIdArg.type === AST_NODE_TYPES.TemplateLiteral &&
          patchIdArg.expressions.length === 0 &&
          patchIdArg.quasis.length === 1
        ) {
          patchId = patchIdArg.quasis[0]!.value.cooked ?? undefined;
        }

        if (!patchId) {
          return;
        }

        // Check for duplicates
        const existing = patchIds.get(patchId);
        if (existing) {
          context.report({
            node: patchIdArg,
            messageId: 'duplicatePatchId',
            data: {
              patchId,
            },
          });
        } else {
          patchIds.set(patchId, {
            node: patchIdArg,
            line: patchIdArg.loc?.start.line ?? 0,
          });
        }
      },
    };
  },
});
