import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { getProperty } from '../../utilities/ast-helpers.ts';
import { createWorkerRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'requiresComment';

const EXPLANATION_COMMENT =
  '// TODO: Explain why these modules are ignored (e.g., server-only, not used in workflows)';

export const ignoremodulesRequiresComment = createWorkerRule<[], MessageIds>({
  name: 'worker-ignoremodules-requires-comment',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a comment explaining why modules are being ignored in bundlerOptions.',
    },
    fixable: 'code',
    messages: {
      requiresComment:
        'Each module in ignoreModules should have a comment explaining why it is being ignored. Ignoring modules can cause runtime errors if the module is actually needed.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      Property(node) {
        // Look for bundlerOptions property
        if (
          node.key.type !== AST_NODE_TYPES.Identifier ||
          node.key.name !== 'bundlerOptions'
        ) {
          return;
        }

        if (node.value.type !== AST_NODE_TYPES.ObjectExpression) {
          return;
        }

        // Check for ignoreModules
        const ignoreModulesProp = getProperty(node.value, 'ignoreModules');
        if (!ignoreModulesProp) {
          return;
        }

        // Check if ignoreModules has a comment nearby
        const comments = sourceCode.getCommentsBefore(ignoreModulesProp);
        const commentsAfter = sourceCode.getCommentsAfter(ignoreModulesProp);
        const allComments = [...comments, ...commentsAfter];

        // If there's a comment that seems explanatory, that's good enough
        // Must be longer than just a short note and not an eslint directive
        const hasExplanatoryComment = allComments.some((comment) => {
          const trimmed = comment.value.trim();
          // Skip eslint directives and short comments
          if (trimmed.startsWith('eslint')) return false;
          if (trimmed.length < 10) return false;
          return true;
        });

        if (!hasExplanatoryComment) {
          // Check if individual array elements have comments
          if (ignoreModulesProp.value.type === AST_NODE_TYPES.ArrayExpression) {
            const arrayHasComments = ignoreModulesProp.value.elements.some((element) => {
              if (!element) return false;
              const elementComments = sourceCode.getCommentsBefore(element);
              return elementComments.length > 0;
            });

            if (arrayHasComments) {
              return; // Has inline comments, good enough
            }
          }

          const indent = ignoreModulesProp.loc
            ? ' '.repeat(ignoreModulesProp.loc.start.column)
            : '';

          context.report({
            node: ignoreModulesProp,
            messageId: 'requiresComment',
            fix(fixer) {
              return fixer.insertTextBefore(
                ignoreModulesProp,
                `${EXPLANATION_COMMENT}\n${indent}`,
              );
            },
          });
        }
      },
    };
  },
});
