import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'wallClockAssumption';

const COMPARISON_OPERATORS = new Set(['<', '<=', '>', '>=']);

export const noWallClockAssumptions = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-wall-clock-assumptions',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Warn when comparing Date.now() to external timestamps, which can imply wall-clock assumptions in workflows.',
    },
    messages: {
      wallClockAssumption:
        'Avoid comparing Date.now() to external timestamps inside workflow code. Workflow time only advances with timers; prefer using Temporal timers/conditions or derive durations from workflow time explicitly.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const derivedTimeStack: Array<Set<string>> = [new Set()];

    function isFunctionLike(node: TSESTree.Node): boolean {
      return (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.ClassDeclaration ||
        node.type === AST_NODE_TYPES.ClassExpression
      );
    }

    function isDateNowCall(node: TSESTree.Node): boolean {
      if (node.type !== AST_NODE_TYPES.CallExpression) return false;
      const { callee } = node;
      if (callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      if (callee.object.type !== AST_NODE_TYPES.Identifier) return false;
      if (callee.object.name !== 'Date') return false;

      if (callee.property.type === AST_NODE_TYPES.Identifier) {
        return callee.property.name === 'now';
      }

      return (
        callee.property.type === AST_NODE_TYPES.Literal && callee.property.value === 'now'
      );
    }

    function currentDerivedSet(): Set<string> {
      return derivedTimeStack[derivedTimeStack.length - 1] ?? new Set();
    }

    function isDerivedIdentifier(name: string): boolean {
      for (let i = derivedTimeStack.length - 1; i >= 0; i -= 1) {
        if (derivedTimeStack[i]?.has(name)) return true;
      }
      return false;
    }

    function expressionIsDerivedTime(node: TSESTree.Node): boolean {
      if (isDateNowCall(node)) return true;

      if (node.type === AST_NODE_TYPES.Identifier) {
        return isDerivedIdentifier(node.name);
      }

      if (
        node.type === AST_NODE_TYPES.MemberExpression &&
        node.object.type === AST_NODE_TYPES.Identifier &&
        isDerivedIdentifier(node.object.name)
      ) {
        return true;
      }

      if (isFunctionLike(node)) return false;

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              if (expressionIsDerivedTime(child as TSESTree.Node)) return true;
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          if (expressionIsDerivedTime(value as TSESTree.Node)) return true;
        }
      }

      return false;
    }

    function markDerivedIdentifier(name: string): void {
      currentDerivedSet().add(name);
    }

    function shouldIgnoreComparison(other: TSESTree.Expression): boolean {
      if (other.type === AST_NODE_TYPES.Literal) return true;
      if (expressionIsDerivedTime(other)) return true;
      return false;
    }

    return {
      FunctionDeclaration() {
        derivedTimeStack.push(new Set());
      },
      'FunctionDeclaration:exit'() {
        derivedTimeStack.pop();
      },
      FunctionExpression() {
        derivedTimeStack.push(new Set());
      },
      'FunctionExpression:exit'() {
        derivedTimeStack.pop();
      },
      ArrowFunctionExpression() {
        derivedTimeStack.push(new Set());
      },
      'ArrowFunctionExpression:exit'() {
        derivedTimeStack.pop();
      },
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;
        if (!node.init) return;
        if (expressionIsDerivedTime(node.init)) {
          markDerivedIdentifier(node.id.name);
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== AST_NODE_TYPES.Identifier) return;
        if (expressionIsDerivedTime(node.right)) {
          markDerivedIdentifier(node.left.name);
        }
      },
      BinaryExpression(node) {
        if (!COMPARISON_OPERATORS.has(node.operator)) return;

        const leftIsDateNow = isDateNowCall(node.left);
        const rightIsDateNow = isDateNowCall(node.right);

        if (!leftIsDateNow && !rightIsDateNow) return;

        const otherSide = leftIsDateNow ? node.right : node.left;
        if (otherSide.type === AST_NODE_TYPES.PrivateIdentifier) return;
        if (shouldIgnoreComparison(otherSide)) return;

        context.report({ node, messageId: 'wallClockAssumption' });
      },
    };
  },
});
