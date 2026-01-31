import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../../utilities/create-rule.ts';
import { isNodeBuiltin } from '../../utilities/temporal-packages.ts';

type MessageIds = 'noNodeImport' | 'noDomApi';

export const noNodeOrDomImports = createRule<[], MessageIds>({
  name: 'no-node-or-dom-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow Node.js built-in modules and DOM APIs in workflow files.',
    },
    messages: {
      noNodeImport:
        "Do not import Node.js module '{{ module }}' in workflows. Node.js APIs are non-deterministic and not available in the workflow sandbox.",
      noDomApi:
        'Do not use DOM APIs in workflows. The DOM is not available in the workflow sandbox.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const isShadowed = (name: string, scope: TSESLint.Scope.Scope): boolean => {
      let current: TSESLint.Scope.Scope | null = scope;
      while (current && (current.type as string) !== 'global') {
        if (current.set.has(name)) {
          return true;
        }
        current = current.upper;
      }

      return false;
    };

    const isDirectDomGlobal = (node: TSESTree.Identifier): boolean =>
      DOM_GLOBALS.has(node.name) && !isShadowed(node.name, sourceCode.getScope(node));

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;

        // Check if it's a Node.js built-in module
        if (isNodeBuiltin(importSource)) {
          context.report({
            node,
            messageId: 'noNodeImport',
            data: {
              module: importSource,
            },
          });
        }
      },

      // Check for global DOM API usage via member expressions
      MemberExpression(node) {
        if (
          node.object.type === AST_NODE_TYPES.Identifier &&
          isDirectDomGlobal(node.object)
        ) {
          context.report({
            node,
            messageId: 'noDomApi',
          });
        }
      },

      CallExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          isDirectDomGlobal(node.callee)
        ) {
          context.report({
            node,
            messageId: 'noDomApi',
          });
        }
      },

      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          isDirectDomGlobal(node.callee)
        ) {
          context.report({
            node,
            messageId: 'noDomApi',
          });
        }
      },
    };
  },
});

/**
 * DOM global objects that should not be used in workflows
 */
const DOM_GLOBALS = new Set([
  'window',
  'document',
  'navigator',
  'location',
  'history',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'ServiceWorker',
  'Notification',
  'Audio',
  'Image',
  'HTMLElement',
  'Element',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'TouchEvent',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
  'IntersectionObserver',
  'MutationObserver',
  'ResizeObserver',
  'PerformanceObserver',
  'matchMedia',
  'getComputedStyle',
  'alert',
  'confirm',
  'prompt',
]);
