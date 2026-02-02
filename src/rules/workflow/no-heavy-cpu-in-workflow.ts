import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

const LARGE_LOOP_THRESHOLD = 10000;

const HEAVY_MEMBER_FUNCTIONS = new Set([
  'pbkdf2',
  'pbkdf2Sync',
  'scrypt',
  'scryptSync',
  'createHash',
  'createHmac',
  'hash',
  'hashSync',
  'compare',
  'compareSync',
]);

const HEAVY_OBJECT_NAMES = new Set(['crypto', 'bcrypt', 'bcryptjs', 'argon2']);

const HEAVY_IDENTIFIER_FUNCTIONS = new Set([
  'pbkdf2',
  'pbkdf2Sync',
  'scrypt',
  'scryptSync',
  'createHash',
  'createHmac',
  'hashSync',
]);

type MessageIds = 'heavyCpu';

export const noHeavyCpuInWorkflow = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-heavy-cpu-in-workflow',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn on CPU-heavy work in workflows. Move expensive computation to activities.',
    },
    messages: {
      heavyCpu:
        'Avoid heavy CPU work in workflows. Move expensive computation to an activity or local activity.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function containsAwait(node: TSESTree.Node): boolean {
      if (node.type === AST_NODE_TYPES.AwaitExpression) return true;

      if (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.ClassDeclaration ||
        node.type === AST_NODE_TYPES.ClassExpression
      ) {
        return false;
      }

      const keys = context.sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;
        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              if (containsAwait(child as TSESTree.Node)) return true;
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (containsAwait(value as TSESTree.Node)) return true;
        }
      }

      return false;
    }

    function getLoopLimit(test: TSESTree.Expression | null): number | null {
      if (!test) return null;
      if (test.type !== AST_NODE_TYPES.BinaryExpression) return null;

      const { left, right, operator } = test;

      if (
        (operator === '<' || operator === '<=') &&
        right.type === AST_NODE_TYPES.Literal &&
        typeof right.value === 'number'
      ) {
        return right.value;
      }

      if (
        (operator === '>' || operator === '>=') &&
        left.type === AST_NODE_TYPES.Literal &&
        typeof left.value === 'number'
      ) {
        return left.value;
      }

      return null;
    }

    function isHeavyCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return HEAVY_IDENTIFIER_FUNCTIONS.has(callee.name);
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        if (HEAVY_MEMBER_FUNCTIONS.has(callee.property.name)) {
          if (callee.object.type === AST_NODE_TYPES.Identifier) {
            if (HEAVY_OBJECT_NAMES.has(callee.object.name)) return true;
          }

          if (callee.object.type === AST_NODE_TYPES.MemberExpression) {
            return true;
          }
        }
      }

      return false;
    }

    return {
      ForStatement(node) {
        if (containsAwait(node.body)) return;
        const limit = getLoopLimit(node.test);
        if (limit !== null && limit >= LARGE_LOOP_THRESHOLD) {
          context.report({ node, messageId: 'heavyCpu' });
        }
      },
      CallExpression(node) {
        if (isHeavyCall(node)) {
          context.report({ node, messageId: 'heavyCpu' });
        }
      },
    };
  },
});
