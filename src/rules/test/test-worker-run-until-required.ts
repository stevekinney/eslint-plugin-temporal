import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getMemberExpressionProperty } from '../../utilities/ast-helpers.ts';
import { createContextRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'runUntilRequired' | 'useRunUntil';

function unwrapCallExpression(
  node: TSESTree.Node | null | undefined,
): TSESTree.CallExpression | null {
  if (!node) return null;
  if (node.type === AST_NODE_TYPES.CallExpression) return node;
  if (
    node.type === AST_NODE_TYPES.AwaitExpression &&
    node.argument.type === AST_NODE_TYPES.CallExpression
  ) {
    return node.argument;
  }
  if (
    node.type === AST_NODE_TYPES.TSNonNullExpression &&
    node.expression.type === AST_NODE_TYPES.CallExpression
  ) {
    return node.expression;
  }
  if (
    node.type === AST_NODE_TYPES.TSAsExpression &&
    node.expression.type === AST_NODE_TYPES.CallExpression
  ) {
    return node.expression;
  }
  return null;
}

export const testWorkerRunUntilRequired = createContextRule<[], MessageIds>('test', {
  name: 'test-worker-run-until-required',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require workers created in tests to be bounded via worker.runUntil(...) to avoid hanging test suites.',
    },
    hasSuggestions: true,
    messages: {
      runUntilRequired:
        'Tests that create a Worker must call worker.runUntil(...) to ensure the worker shuts down and the test does not hang.',
      useRunUntil: 'Chain .runUntil() to the Worker.create() call.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const workerClassNames = new Set<string>();
    const workerNamespaceNames = new Set<string>();
    const workerVariables = new Map<TSESTree.CallExpression, string>();
    const workerCreateCalls = new Set<TSESTree.CallExpression>();
    const createCallsWithRunUntil = new Set<TSESTree.CallExpression>();
    const runUntilTargets = new Set<string>();

    function isWorkerCreateCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      const prop = getMemberExpressionProperty(node.callee);
      if (prop !== 'create') return false;

      const objectNode = node.callee.object;
      if (
        objectNode.type === AST_NODE_TYPES.Identifier &&
        workerClassNames.has(objectNode.name)
      ) {
        return true;
      }

      if (objectNode.type === AST_NODE_TYPES.MemberExpression) {
        const objectProp = getMemberExpressionProperty(objectNode);
        if (objectProp !== 'Worker') return false;
        if (
          objectNode.object.type === AST_NODE_TYPES.Identifier &&
          workerNamespaceNames.has(objectNode.object.name)
        ) {
          return true;
        }
      }

      return false;
    }

    function isRunUntilCall(node: TSESTree.CallExpression): {
      targetName?: string;
      inlineCreate?: TSESTree.CallExpression;
    } | null {
      const callee =
        node.callee.type === AST_NODE_TYPES.ChainExpression
          ? node.callee.expression
          : node.callee;
      if (callee.type !== AST_NODE_TYPES.MemberExpression) return null;
      const prop = getMemberExpressionProperty(callee);
      if (prop !== 'runUntil') return null;

      if (callee.object.type === AST_NODE_TYPES.Identifier) {
        return { targetName: callee.object.name };
      }

      if (callee.object.type === AST_NODE_TYPES.CallExpression) {
        if (isWorkerCreateCall(callee.object)) {
          return { inlineCreate: callee.object };
        }
      }

      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@temporalio/worker') return;
        if (node.importKind === 'type') return;

        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            const importedName =
              specifier.imported.type === AST_NODE_TYPES.Identifier
                ? specifier.imported.name
                : String(specifier.imported.value);
            if (importedName === 'Worker') {
              if (specifier.importKind === 'type') continue;
              workerClassNames.add(specifier.local.name);
            }
          }

          if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
            workerNamespaceNames.add(specifier.local.name);
          }
        }
      },

      VariableDeclarator(node) {
        if (!node.init) return;
        const call = unwrapCallExpression(node.init);
        if (!call || !isWorkerCreateCall(call)) return;

        workerCreateCalls.add(call);
        if (node.id.type === AST_NODE_TYPES.Identifier) {
          workerVariables.set(call, node.id.name);
        }
      },

      AssignmentExpression(node) {
        if (node.left.type !== AST_NODE_TYPES.Identifier) return;
        const call = unwrapCallExpression(node.right);
        if (!call || !isWorkerCreateCall(call)) return;

        workerCreateCalls.add(call);
        workerVariables.set(call, node.left.name);
      },

      CallExpression(node) {
        if (isWorkerCreateCall(node)) {
          workerCreateCalls.add(node);
        }

        const runUntil = isRunUntilCall(node);
        if (!runUntil) return;

        if (runUntil.targetName) {
          runUntilTargets.add(runUntil.targetName);
        }

        if (runUntil.inlineCreate) {
          createCallsWithRunUntil.add(runUntil.inlineCreate);
        }
      },

      'Program:exit'() {
        for (const createCall of workerCreateCalls) {
          if (createCallsWithRunUntil.has(createCall)) continue;
          const assignedName = workerVariables.get(createCall);
          if (assignedName && runUntilTargets.has(assignedName)) continue;

          context.report({
            node: createCall,
            messageId: 'runUntilRequired',
            suggest: [
              {
                messageId: 'useRunUntil',
                fix(fixer) {
                  // Add .runUntil() after the create call
                  return fixer.insertTextAfter(
                    createCall,
                    `.runUntil(async () => { /* TODO: run workflow */ })`,
                  );
                },
              },
            ],
          });
        }
      },
    };
  },
});
