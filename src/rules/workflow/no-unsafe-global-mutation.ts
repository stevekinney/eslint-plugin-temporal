import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';

type MessageIds = 'noGlobalMutation' | 'noPrototypeMutation';

/**
 * Global objects that should not be mutated in workflows
 */
const UNSAFE_GLOBALS = new Set(['globalThis', 'global', 'window', 'self']);

/**
 * Objects whose prototype should not be modified
 */
const PROTECTED_PROTOTYPES = new Set([
  'Object',
  'Array',
  'String',
  'Number',
  'Boolean',
  'Function',
  'Date',
  'RegExp',
  'Error',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Symbol',
  'BigInt',
  'JSON',
  'Math',
  'Reflect',
  'Proxy',
]);

export const noUnsafeGlobalMutation = createRule<[], MessageIds>({
  name: 'no-unsafe-global-mutation',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow mutations to globalThis or built-in prototypes in workflows. Such mutations are non-deterministic and break workflow replay.',
    },
    messages: {
      noGlobalMutation:
        'Do not mutate {{ global }} in workflows. Global mutations are non-deterministic because they persist across workflow invocations and affect other code. Use local variables or workflow state instead.',
      noPrototypeMutation:
        'Do not modify {{ object }}.prototype in workflows. Prototype mutations are non-deterministic and affect all instances. They can cause replay failures when the prototype state differs between original execution and replay.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isGlobalObject(node: TSESTree.Expression): string | null {
      if (node.type === AST_NODE_TYPES.Identifier && UNSAFE_GLOBALS.has(node.name)) {
        return node.name;
      }
      return null;
    }

    function isPrototypeMutation(
      node: TSESTree.MemberExpression,
    ): { object: string; isPrototype: boolean } | null {
      // Check for patterns like Object.prototype or Array.prototype
      if (
        node.object.type === AST_NODE_TYPES.MemberExpression &&
        node.object.property.type === AST_NODE_TYPES.Identifier &&
        node.object.property.name === 'prototype' &&
        node.object.object.type === AST_NODE_TYPES.Identifier &&
        PROTECTED_PROTOTYPES.has(node.object.object.name)
      ) {
        return { object: node.object.object.name, isPrototype: true };
      }

      // Check for direct Object.prototype assignment
      if (
        node.property.type === AST_NODE_TYPES.Identifier &&
        node.property.name === 'prototype' &&
        node.object.type === AST_NODE_TYPES.Identifier &&
        PROTECTED_PROTOTYPES.has(node.object.name)
      ) {
        return { object: node.object.name, isPrototype: true };
      }

      return null;
    }

    function isGlobalMemberAccess(node: TSESTree.MemberExpression): string | null {
      if (
        node.object.type === AST_NODE_TYPES.Identifier &&
        UNSAFE_GLOBALS.has(node.object.name)
      ) {
        return node.object.name;
      }
      return null;
    }

    return {
      AssignmentExpression(node) {
        const left = node.left;

        // Check for direct global assignment (globalThis.foo = bar)
        if (left.type === AST_NODE_TYPES.MemberExpression) {
          const globalName = isGlobalMemberAccess(left);
          if (globalName) {
            context.report({
              node,
              messageId: 'noGlobalMutation',
              data: { global: globalName },
            });
            return;
          }

          // Check for prototype mutation (Object.prototype.foo = bar)
          const prototypeMutation = isPrototypeMutation(left);
          if (prototypeMutation) {
            context.report({
              node,
              messageId: 'noPrototypeMutation',
              data: { object: prototypeMutation.object },
            });
            return;
          }
        }
      },

      CallExpression(node) {
        // Check for Object.defineProperty on prototypes
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          (node.callee.property.name === 'defineProperty' ||
            node.callee.property.name === 'defineProperties')
        ) {
          const firstArg = node.arguments[0];
          if (firstArg?.type === AST_NODE_TYPES.MemberExpression) {
            // Check if it's X.prototype
            if (
              firstArg.property.type === AST_NODE_TYPES.Identifier &&
              firstArg.property.name === 'prototype' &&
              firstArg.object.type === AST_NODE_TYPES.Identifier &&
              PROTECTED_PROTOTYPES.has(firstArg.object.name)
            ) {
              context.report({
                node,
                messageId: 'noPrototypeMutation',
                data: { object: firstArg.object.name },
              });
            }
          }

          // Check if first arg is a global
          if (firstArg?.type === AST_NODE_TYPES.Identifier) {
            const globalName = isGlobalObject(firstArg);
            if (globalName) {
              context.report({
                node,
                messageId: 'noGlobalMutation',
                data: { global: globalName },
              });
            }
          }
        }

        // Check for Object.assign on globals
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === 'assign'
        ) {
          const firstArg = node.arguments[0];
          if (firstArg?.type === AST_NODE_TYPES.Identifier) {
            const globalName = isGlobalObject(firstArg);
            if (globalName) {
              context.report({
                node,
                messageId: 'noGlobalMutation',
                data: { global: globalName },
              });
            }
          }
        }

        // Check for Object.setPrototypeOf
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === 'Object' &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === 'setPrototypeOf'
        ) {
          const firstArg = node.arguments[0];
          if (firstArg?.type === AST_NODE_TYPES.MemberExpression) {
            if (
              firstArg.property.type === AST_NODE_TYPES.Identifier &&
              firstArg.property.name === 'prototype' &&
              firstArg.object.type === AST_NODE_TYPES.Identifier &&
              PROTECTED_PROTOTYPES.has(firstArg.object.name)
            ) {
              context.report({
                node,
                messageId: 'noPrototypeMutation',
                data: { object: firstArg.object.name },
              });
            }
          }
        }
      },
    };
  },
});
