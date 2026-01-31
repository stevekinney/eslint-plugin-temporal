import type { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noMixedEnvironments';

export const noWorkflowAndActivityInSameFile = createRule<[], MessageIds>({
  name: 'no-workflow-and-activity-in-same-file',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing both @temporalio/workflow and @temporalio/activity in the same file. These run in different environments and should not be mixed.',
    },
    messages: {
      noMixedEnvironments:
        "Do not import both '@temporalio/workflow' and '@temporalio/activity' in the same file. Workflows run in a sandboxed environment while activities run in Node.js. Mixing these environments indicates a code organization issue. Separate workflow and activity code into different files.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    let workflowImport: TSESTree.ImportDeclaration | null = null;
    let activityImport: TSESTree.ImportDeclaration | null = null;

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        // Skip type-only imports as they don't indicate actual usage
        if (node.importKind === 'type') {
          return;
        }

        if (source === TEMPORAL_PACKAGES.workflow) {
          workflowImport = node;
        } else if (source === TEMPORAL_PACKAGES.activity) {
          activityImport = node;
        }
      },
      'Program:exit'() {
        // Report if both imports are present
        if (workflowImport && activityImport) {
          // Report on the activity import since it's typically the "wrong" one
          // when someone accidentally imports it in a workflow file
          context.report({
            node: activityImport,
            messageId: 'noMixedEnvironments',
          });

          // Also report on the workflow import to make both visible
          context.report({
            node: workflowImport,
            messageId: 'noMixedEnvironments',
          });
        }
      },
    };
  },
});
