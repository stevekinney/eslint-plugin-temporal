import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { CONSOLE_TO_LOG_MAP } from '../../types.ts';
import { createActivityRule } from '../../utilities/create-context-rule.ts';
import { ensureImport } from '../../utilities/import-fixer.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

type MessageIds = 'preferActivityLog';

export const preferActivityLog = createActivityRule<[], MessageIds>({
  name: 'activity-prefer-activity-log',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer log from @temporalio/activity over console.* for structured logging.',
    },
    messages: {
      preferActivityLog:
        "Consider using log.{{ logMethod }}() from '@temporalio/activity' instead of console.{{ method }}(). The activity logger integrates with Temporal's logging system and includes activity context.",
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

        const logMethod = CONSOLE_TO_LOG_MAP[methodName];
        if (!logMethod) {
          return; // Unknown console method, skip
        }

        context.report({
          node: node.callee,
          messageId: 'preferActivityLog',
          data: {
            method: methodName,
            logMethod,
          },
          *fix(fixer) {
            // Replace console.method with log.logMethod
            yield fixer.replaceText(node.callee, `log.${logMethod}`);

            // Ensure log is imported from @temporalio/activity
            yield* ensureImport(fixer, sourceCode, TEMPORAL_PACKAGES.activity, 'log');
          },
        });
      },
    };
  },
});
