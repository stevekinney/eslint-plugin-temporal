import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'noDynamicImport';

export const noDynamicImport = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-dynamic-import',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow dynamic import() expressions in workflow files. Dynamic imports break bundling and are non-deterministic.',
    },
    messages: {
      noDynamicImport:
        'Do not use dynamic import() in workflows. Dynamic imports break workflow bundling and can cause non-deterministic behavior. Use static imports instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportExpression(node) {
        context.report({
          node,
          messageId: 'noDynamicImport',
        });
      },
    };
  },
});
