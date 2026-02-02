import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { getParentStatement } from '../../utilities/get-parent-statement.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

const UUID4_COMMENT =
  /(temporal-uuid4|uuid4.*(deterministic|not secure|insecure|not crypt)|deterministic.*uuid4)/i;

const SECURITY_COMMENT = '// temporal-uuid4: deterministic, not cryptographically secure';

type MessageIds = 'uuid4RequiresComment';

export const uuid4RequiresSecurityComment = createWorkflowRule<[], MessageIds>({
  name: 'workflow-uuid4-requires-security-comment',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require a comment noting that uuid4() is deterministic and not cryptographically secure.',
    },
    fixable: 'code',
    messages: {
      uuid4RequiresComment:
        'Add a comment noting that uuid4() is deterministic and not cryptographically secure.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const tracker = new ImportTracker();
    const sourceCode = context.sourceCode;
    const uuid4LocalNames = new Set<string>();
    const workflowNamespaceNames = new Set<string>();
    let importsSeeded = false;

    function seedWorkflowImports(): void {
      const workflowImport = tracker
        .getAllImports()
        .find((imp) => imp.source === TEMPORAL_PACKAGES.workflow);
      if (!workflowImport) return;

      for (const specifier of workflowImport.specifiers) {
        if (specifier.isTypeOnly) continue;

        if (specifier.imported === '*') {
          workflowNamespaceNames.add(specifier.local);
          continue;
        }

        if (specifier.imported === 'uuid4') {
          uuid4LocalNames.add(specifier.local);
        }
      }
    }

    function ensureWorkflowImportsSeeded(): void {
      if (importsSeeded) return;
      seedWorkflowImports();
      importsSeeded = true;
    }

    function hasSecurityComment(node: TSESTree.Node): boolean {
      const commentTargets: TSESTree.Node[] = [node];
      let current: TSESTree.Node | undefined = node.parent ?? undefined;

      while (current) {
        if (
          current.type === AST_NODE_TYPES.ExpressionStatement ||
          current.type === AST_NODE_TYPES.VariableDeclaration ||
          current.type === AST_NODE_TYPES.ReturnStatement
        ) {
          commentTargets.push(current);
          break;
        }
        current = current.parent ?? undefined;
      }

      return commentTargets.some((target) => {
        const comments = [
          ...sourceCode.getCommentsBefore(target),
          ...sourceCode.getCommentsAfter(target),
        ];
        return comments.some((comment) => {
          if (!comment.loc || !target.loc) return false;
          const lineDelta = Math.abs(comment.loc.end.line - target.loc.start.line);
          if (lineDelta > 1) return false;
          return UUID4_COMMENT.test(comment.value);
        });
      });
    }

    function isUuid4Call(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return uuid4LocalNames.has(callee.name);
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return (
          workflowNamespaceNames.has(callee.object.name) &&
          callee.property.name === 'uuid4'
        );
      }

      return false;
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      CallExpression(node) {
        ensureWorkflowImportsSeeded();
        if (!isUuid4Call(node)) return;
        if (hasSecurityComment(node)) return;

        const statement = getParentStatement(node);
        const indent = statement.loc ? ' '.repeat(statement.loc.start.column) : '';

        context.report({
          node,
          messageId: 'uuid4RequiresComment',
          fix(fixer) {
            return fixer.insertTextBefore(statement, `${SECURITY_COMMENT}\n${indent}`);
          },
        });
      },
    };
  },
});
