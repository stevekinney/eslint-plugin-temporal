import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

const NONDETERMINISTIC_IDENTIFIERS = new Set([
  'uuid4',
  'nanoid',
  'cuid',
  'cuid2',
  'ulid',
  'ksuid',
  'shortid',
  'hyperid',
]);

const NONDETERMINISTIC_MEMBERS = new Set([
  'Math.random',
  'Date.now',
  'crypto.randomUUID',
  'performance.now',
]);

const DETERMINISM_COMMENT =
  /(temporal[- ]deterministic|temporal[- ]allow|temporal[- ]nondeterministic|uuid4.*(deterministic|not secure)|deterministic.*uuid4)/i;

type MessageIds = 'nondeterministicControlFlow';

export const noNondeterministicControlFlow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-nondeterministic-control-flow',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when control flow depends on time or randomness without an explicit determinism comment.',
    },
    messages: {
      nondeterministicControlFlow:
        'Control flow depends on time or randomness. Add a comment explaining why this is safe for deterministic replay.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function hasDeterminismComment(node: TSESTree.Node): boolean {
      const comments = [
        ...sourceCode.getCommentsBefore(node),
        ...sourceCode.getCommentsAfter(node),
      ];
      return comments.some((comment) => {
        if (!comment.loc) return false;
        const lineDelta = Math.abs(comment.loc.end.line - node.loc.start.line);
        if (lineDelta > 1) return false;
        return DETERMINISM_COMMENT.test(comment.value);
      });
    }

    function isNondeterministicCall(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.CallExpression) {
        const { callee } = node;

        if (callee.type === AST_NODE_TYPES.Identifier) {
          return NONDETERMINISTIC_IDENTIFIERS.has(callee.name);
        }

        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.property.type === AST_NODE_TYPES.Identifier
        ) {
          const key = `${callee.object.name}.${callee.property.name}`;
          return NONDETERMINISTIC_MEMBERS.has(key);
        }
      }

      if (node.type === AST_NODE_TYPES.NewExpression) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'Date'
        ) {
          return true;
        }
      }

      return false;
    }

    function containsNondeterminism(node: TSESTree.Node): boolean {
      if (isNondeterministicCall(node)) return true;

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              if (containsNondeterminism(child as TSESTree.Node)) return true;
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (containsNondeterminism(value as TSESTree.Node)) return true;
        }
      }

      return false;
    }

    function checkControlFlow(node: TSESTree.Node, test: TSESTree.Node | null): void {
      if (!test) return;
      if (!containsNondeterminism(test)) return;
      if (hasDeterminismComment(node)) return;

      context.report({ node, messageId: 'nondeterministicControlFlow' });
    }

    return {
      IfStatement(node) {
        checkControlFlow(node, node.test);
      },
      ConditionalExpression(node) {
        checkControlFlow(node, node.test);
      },
      WhileStatement(node) {
        checkControlFlow(node, node.test);
      },
      DoWhileStatement(node) {
        checkControlFlow(node, node.test);
      },
      ForStatement(node) {
        checkControlFlow(node, node.test);
      },
      SwitchStatement(node) {
        checkControlFlow(node, node.discriminant);
      },
    };
  },
});
