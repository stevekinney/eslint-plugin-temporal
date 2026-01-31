import { createRule } from '../../utilities/create-rule.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noWorkerImport';

export const noWorkerImport = createRule<[], MessageIds>({
  name: 'no-worker-import',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing @temporalio/worker in workflow files. Workflows run in a sandboxed environment and cannot use Worker APIs.',
    },
    messages: {
      noWorkerImport:
        "Do not import '@temporalio/worker' in workflows. Workflows run in a sandboxed environment and cannot use Worker APIs. Worker configuration should be done in separate worker files.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value !== TEMPORAL_PACKAGES.worker) {
          return;
        }

        // Type-only imports are allowed (for typing purposes)
        if (node.importKind === 'type') {
          return;
        }

        context.report({
          node,
          messageId: 'noWorkerImport',
        });
      },
    };
  },
});
