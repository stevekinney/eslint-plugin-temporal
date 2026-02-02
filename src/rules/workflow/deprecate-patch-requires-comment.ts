import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getIndentation,
  getParentStatement,
} from '../../utilities/get-parent-statement.ts';

type MessageIds = 'requiresComment';

const DEPRECATION_COMMENT =
  '// TODO: Safe to deprecate after YYYY-MM-DD when all old workflows have completed';

export const deprecatePatchRequiresComment = createWorkflowRule<[], MessageIds>({
  name: 'workflow-deprecate-patch-requires-comment',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a comment explaining why deprecatePatch is safe to call. Premature deprecation can break old workflow executions.',
    },
    fixable: 'code',
    messages: {
      requiresComment:
        'Add a comment explaining why deprecatePatch is safe. Deprecating a patch before all old workflow executions have completed can cause non-determinism errors. Include: (1) when the patch was introduced, (2) why it\'s safe to deprecate (e.g., "All workflows from before 2024-01-01 have completed").',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      CallExpression(node) {
        // Check for deprecatePatch() calls
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'deprecatePatch'
        ) {
          return;
        }

        // Get all comments in the source
        const allComments = sourceCode.getAllComments();

        // Check for leading comments on the call expression
        const callComments = sourceCode.getCommentsBefore(node);
        const hasCallLeadingComment = callComments.length > 0;

        // Check for comments on the parent statement
        const parent = node.parent;
        let hasStatementComment = false;
        let hasTrailingComment = false;

        if (parent?.type === AST_NODE_TYPES.ExpressionStatement) {
          const parentComments = sourceCode.getCommentsBefore(parent);
          hasStatementComment = parentComments.length > 0;

          // Check for trailing comment on the same line as the statement
          const statementEnd = parent.loc?.end;
          if (statementEnd) {
            hasTrailingComment = allComments.some(
              (comment) =>
                comment.loc?.start.line === statementEnd.line &&
                comment.loc?.start.column > statementEnd.column - 1,
            );
          }
        }

        if (!hasCallLeadingComment && !hasStatementComment && !hasTrailingComment) {
          const statement = getParentStatement(node);
          const indent = getIndentation(statement);

          context.report({
            node,
            messageId: 'requiresComment',
            fix(fixer) {
              return fixer.insertTextBefore(
                statement,
                `${DEPRECATION_COMMENT}\n${indent}`,
              );
            },
          });
        }
      },
    };
  },
});
