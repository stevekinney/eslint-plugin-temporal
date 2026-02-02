import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import { ImportTracker } from '../../utilities/import-tracker.ts';
import { TEMPORAL_PACKAGES } from '../../utilities/temporal-packages.ts';

const COMMAND_NAMES = new Set([
  'sleep',
  'condition',
  'startChild',
  'executeChild',
  'continueAsNew',
  'signalExternalWorkflow',
  'cancelExternalWorkflow',
]);

const PROXY_FACTORIES = new Set(['proxyActivities', 'proxyLocalActivities']);

type MessageIds = 'topLevelSideEffect';

export const noTopLevelWorkflowSideEffects = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-top-level-workflow-side-effects',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow top-level workflow commands (sleep, activities, child workflows) outside workflow functions.',
    },
    messages: {
      topLevelSideEffect:
        'Avoid scheduling workflow commands at module scope. Move this call into a workflow function to keep module evaluation side-effect free.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const tracker = new ImportTracker();
    const sourceCode = context.sourceCode;

    const workflowNamespaceNames = new Set<string>();
    const commandLocalNames = new Set<string>();
    const proxyFactoryNames = new Set<string>();
    const activityProxyNames = new Set<string>();

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

        if (COMMAND_NAMES.has(specifier.imported)) {
          commandLocalNames.add(specifier.local);
        }

        if (PROXY_FACTORIES.has(specifier.imported)) {
          proxyFactoryNames.add(specifier.local);
        }
      }
    }

    function isProxyFactoryCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return proxyFactoryNames.has(callee.name);
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        return (
          workflowNamespaceNames.has(callee.object.name) &&
          PROXY_FACTORIES.has(callee.property.name)
        );
      }

      return false;
    }

    function addProxyFromDeclarator(node: TSESTree.VariableDeclarator): void {
      if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) return;
      if (!isProxyFactoryCall(node.init)) return;

      if (node.id.type === AST_NODE_TYPES.Identifier) {
        activityProxyNames.add(node.id.name);
        return;
      }

      if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
        for (const property of node.id.properties) {
          if (
            property.type === AST_NODE_TYPES.Property &&
            property.key.type === AST_NODE_TYPES.Identifier
          ) {
            activityProxyNames.add(property.key.name);
          }
        }
      }
    }

    function isCommandCall(node: TSESTree.CallExpression): boolean {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        if (commandLocalNames.has(callee.name)) return true;
        if (activityProxyNames.has(callee.name)) return true;
      }

      if (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.property.type === AST_NODE_TYPES.Identifier
      ) {
        if (
          workflowNamespaceNames.has(callee.object.name) &&
          COMMAND_NAMES.has(callee.property.name)
        ) {
          return true;
        }

        if (activityProxyNames.has(callee.object.name)) {
          return true;
        }
      }

      return false;
    }

    function traverse(node: TSESTree.Node): void {
      if (
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression ||
        node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.ClassDeclaration ||
        node.type === AST_NODE_TYPES.ClassExpression
      ) {
        return;
      }

      if (node.type === AST_NODE_TYPES.CallExpression && isCommandCall(node)) {
        context.report({ node, messageId: 'topLevelSideEffect' });
      }

      const keys = sourceCode.visitorKeys[node.type] ?? [];
      for (const key of keys) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (!value) continue;

        if (Array.isArray(value)) {
          for (const child of value) {
            if (child && typeof child === 'object' && 'type' in child) {
              traverse(child as TSESTree.Node);
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          traverse(value as TSESTree.Node);
        }
      }
    }

    function collectProxies(program: TSESTree.Program): void {
      for (const statement of program.body) {
        const target =
          statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
          statement.declaration
            ? statement.declaration
            : statement;

        if (target.type === AST_NODE_TYPES.VariableDeclaration) {
          for (const declarator of target.declarations) {
            addProxyFromDeclarator(declarator);
          }
        }
      }
    }

    return {
      ImportDeclaration(node) {
        tracker.addImport(node);
      },
      'Program:exit'(node) {
        seedWorkflowImports();
        collectProxies(node);

        for (const statement of node.body) {
          traverse(statement);
        }
      },
    };
  },
});
