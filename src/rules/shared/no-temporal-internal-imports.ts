import { createRule } from '../../utilities/create-rule.ts';
import { isTemporalInternalImport } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noInternalImport';

export const noTemporalInternalImports = createRule<[], MessageIds>({
  name: 'no-temporal-internal-imports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing from internal Temporal SDK paths (e.g., @temporalio/*/lib/*).',
    },
    messages: {
      noInternalImport:
        "Do not import from internal Temporal SDK paths ('{{ path }}'). Internal modules may change without notice between versions. Use the public API from '{{ publicPath }}' instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        if (!isTemporalInternalImport(importPath)) {
          return;
        }

        // Extract the public path (e.g., @temporalio/workflow)
        const parts = importPath.split('/');
        const publicPath = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;

        context.report({
          node,
          messageId: 'noInternalImport',
          data: {
            path: importPath,
            publicPath,
          },
        });
      },
    };
  },
});
