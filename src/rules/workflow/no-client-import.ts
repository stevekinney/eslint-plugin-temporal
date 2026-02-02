import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noClientImport';

export const noClientImport = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-client-import',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing @temporalio/client in workflow files. Workflows cannot use the Client directly.',
    },
    messages: {
      noClientImport:
        "Do not import '@temporalio/client' in workflows. Workflows run in a sandboxed environment and cannot use the Temporal Client directly. To start child workflows, use startChild() or executeChild() from '@temporalio/workflow'. To make external API calls, use activities.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== TEMPORAL_PACKAGES.client) {
          return;
        }

        // Type-only imports are allowed (for typing purposes)
        if (node.importKind === 'type') {
          return;
        }

        context.report({
          node,
          messageId: 'noClientImport',
        });
      },
    };
  },
});
