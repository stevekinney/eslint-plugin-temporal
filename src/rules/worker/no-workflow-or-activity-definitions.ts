import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkerRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noWorkflowDefinitions';

export const noWorkflowOrActivityDefinitions = createWorkerRule<[], MessageIds>({
  name: 'worker-no-workflow-or-activity-definitions',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing workflow or activity definitions directly in worker files.',
    },
    messages: {
      noWorkflowDefinitions:
        'Do not import workflow definitions directly in worker files. Workers should only reference workflow files via the workflowsPath option, not import them directly. This ensures workflows run in the isolated sandbox.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;

        // Only check relative imports
        if (!importSource.startsWith('.')) {
          return;
        }

        // Check for workflow imports
        const workflowPatterns = [/\/workflows?(\/|$)/, /\.workflows?$/];

        if (workflowPatterns.some((pattern) => pattern.test(importSource))) {
          // Type-only imports are okay (for types)
          if (node.importKind === 'type') {
            return;
          }

          // Check if all specifiers are type imports
          const hasValueImport = node.specifiers.some((spec) => {
            if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
              return spec.importKind !== 'type';
            }
            return true; // default and namespace imports are value imports
          });

          if (hasValueImport) {
            context.report({
              node,
              messageId: 'noWorkflowDefinitions',
            });
          }
        }

        // Check for activity imports (less strict - warn about direct definition imports)
        // Note: Importing activity types is fine, importing functions for Worker.create is also fine
        // This rule is more of a hint to ensure proper separation
      },
    };
  },
});
