import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { CONSOLE_TO_LOG_MAP } from '../../types.ts';
import { createRule } from '../../utilities/create-rule.ts';
import { ensureImport } from '../../utilities/import-fixer.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noConsole';

export const noConsole = createRule<[], MessageIds>({
  name: 'no-console',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow console.* in workflow files. Use log from @temporalio/workflow instead.',
    },
    messages: {
      noConsole:
        "Do not use console.{{ method }}() in workflows. Use log.{{ logMethod }}() from '@temporalio/workflow' instead. The workflow log integrates with Temporal's logging system.",
    },
    fixable: 'code',
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        // Check for console.method() pattern
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.object.type !== AST_NODE_TYPES.Identifier ||
          node.callee.object.name !== 'console'
        ) {
          return;
        }

        const property = node.callee.property;
        let methodName: string | undefined;

        if (property.type === AST_NODE_TYPES.Identifier) {
          methodName = property.name;
        } else if (
          property.type === AST_NODE_TYPES.Literal &&
          typeof property.value === 'string'
        ) {
          methodName = property.value;
        }

        if (!methodName) {
          return;
        }

        // Only handle known console methods
        const logMethod = CONSOLE_TO_LOG_MAP[methodName];
        if (!logMethod) {
          // For unknown methods, still report but don't suggest a fix
          context.report({
            node: node.callee,
            messageId: 'noConsole',
            data: {
              method: methodName,
              logMethod: 'info',
            },
          });
          return;
        }

        context.report({
          node: node.callee,
          messageId: 'noConsole',
          data: {
            method: methodName,
            logMethod,
          },
          *fix(fixer) {
            // Replace console.method with log.logMethod
            yield fixer.replaceText(node.callee, `log.${logMethod}`);

            // Ensure log is imported from @temporalio/workflow
            yield* ensureImport(fixer, sourceCode, TEMPORAL_PACKAGES.workflow, 'log');
          },
        });
      },
    };
  },
});
