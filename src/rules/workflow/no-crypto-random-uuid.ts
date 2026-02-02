import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ensureImport } from '../../utilities/import-fixer.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noCryptoRandomUuid';

export const noCryptoRandomUuid = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-crypto-random-uuid',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow crypto.randomUUID() in workflow files. Use uuid4() from @temporalio/workflow instead.',
    },
    messages: {
      noCryptoRandomUuid:
        "Do not use crypto.randomUUID() in workflows. It is non-deterministic and will produce different values on replay. Use uuid4() from '@temporalio/workflow' which is deterministic.",
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        // Check for crypto.randomUUID() pattern
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.object.type !== AST_NODE_TYPES.Identifier ||
          node.callee.object.name !== 'crypto' ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          node.callee.property.name !== 'randomUUID'
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noCryptoRandomUuid',
          *fix(fixer) {
            // Replace crypto.randomUUID() with uuid4()
            yield fixer.replaceText(node, 'uuid4()');

            // Ensure uuid4 is imported from @temporalio/workflow
            yield* ensureImport(fixer, sourceCode, TEMPORAL_PACKAGES.workflow, 'uuid4');
          },
        });
      },
    };
  },
});
