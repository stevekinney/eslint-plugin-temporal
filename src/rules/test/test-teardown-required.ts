import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getMemberExpressionProperty } from '../../utilities/ast-helpers.ts';
import { createContextRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'teardownRequired' | 'addTeardownHook';

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

function isAfterHookCall(node: TSESTree.CallExpression): boolean {
  if (node.callee.type === AST_NODE_TYPES.Identifier) {
    return node.callee.name === 'afterAll' || node.callee.name === 'afterEach';
  }
  if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
    const name = getMemberExpressionProperty(node.callee);
    return name === 'afterAll' || name === 'afterEach';
  }
  return false;
}

function isTeardownCall(node: TSESTree.CallExpression): { targetName?: string } | null {
  const callee =
    node.callee.type === AST_NODE_TYPES.ChainExpression
      ? node.callee.expression
      : node.callee;

  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    const prop = getMemberExpressionProperty(callee);
    if (prop !== 'teardown') return null;

    if (callee.object.type === AST_NODE_TYPES.Identifier) {
      return { targetName: callee.object.name };
    }
    return {};
  }

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return { targetName: callee.name };
  }

  return null;
}

export const testTeardownRequired = createContextRule<[], MessageIds>('test', {
  name: 'test-teardown-required',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require TestWorkflowEnvironment.teardown() to run in afterAll/afterEach when tests create a TestWorkflowEnvironment.',
    },
    hasSuggestions: true,
    messages: {
      teardownRequired:
        'Tests using TestWorkflowEnvironment must call teardown() in afterAll/afterEach to avoid leaked workers and hanging tests.',
      addTeardownHook: 'Add afterAll hook with teardown call.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const testEnvClassNames = new Set<string>();
    const testEnvNamespaceNames = new Set<string>();
    const testEnvVariables = new Set<string>();
    const teardownAliases = new Set<string>();
    const afterHookCallbacks = new Set<TSESTree.Node>();
    const createCalls: TSESTree.CallExpression[] = [];

    let usesTestEnv = false;
    let hasTeardownInAfterHook = false;

    function isTestEnvCreateCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
      const prop = getMemberExpressionProperty(node.callee);
      if (!prop || !prop.startsWith('create')) return false;

      const objectNode = node.callee.object;
      if (
        objectNode.type === AST_NODE_TYPES.Identifier &&
        testEnvClassNames.has(objectNode.name)
      ) {
        return true;
      }

      if (objectNode.type === AST_NODE_TYPES.MemberExpression) {
        const objectProp = getMemberExpressionProperty(objectNode);
        if (!objectProp || objectProp !== 'TestWorkflowEnvironment') return false;
        if (
          objectNode.object.type === AST_NODE_TYPES.Identifier &&
          testEnvNamespaceNames.has(objectNode.object.name)
        ) {
          return true;
        }
      }

      return false;
    }

    function registerAfterHook(node: TSESTree.CallExpression): void {
      if (!isAfterHookCall(node)) return;
      for (const arg of node.arguments) {
        if (
          arg.type === AST_NODE_TYPES.FunctionExpression ||
          arg.type === AST_NODE_TYPES.ArrowFunctionExpression
        ) {
          afterHookCallbacks.add(arg);
        }
      }
    }

    function isInsideAfterHook(node: TSESTree.Node): boolean {
      const ancestors = sourceCode.getAncestors(node);
      return ancestors.some((ancestor) => afterHookCallbacks.has(ancestor));
    }

    function recordEnvBinding(
      id: TSESTree.BindingName,
      init: TSESTree.Node | null | undefined,
    ): void {
      const call = unwrapCallExpression(init);
      if (!call || !isTestEnvCreateCall(call)) return;

      usesTestEnv = true;
      createCalls.push(call);

      if (id.type === AST_NODE_TYPES.Identifier) {
        testEnvVariables.add(id.name);
        return;
      }

      if (id.type === AST_NODE_TYPES.ObjectPattern) {
        for (const prop of id.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue;
          const keyName =
            prop.key.type === AST_NODE_TYPES.Identifier
              ? prop.key.name
              : prop.key.type === AST_NODE_TYPES.Literal
                ? String(prop.key.value)
                : undefined;
          if (keyName !== 'teardown') continue;
          if (prop.value.type === AST_NODE_TYPES.Identifier) {
            teardownAliases.add(prop.value.name);
          }
        }
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@temporalio/testing') return;

        if (node.importKind === 'type') return;

        for (const specifier of node.specifiers) {
          if (specifier.type === AST_NODE_TYPES.ImportSpecifier) {
            const importedName =
              specifier.imported.type === AST_NODE_TYPES.Identifier
                ? specifier.imported.name
                : String(specifier.imported.value);
            if (importedName === 'TestWorkflowEnvironment') {
              if (specifier.importKind === 'type') continue;
              testEnvClassNames.add(specifier.local.name);
            }
          }

          if (specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
            testEnvNamespaceNames.add(specifier.local.name);
          }
        }
      },

      VariableDeclarator(node) {
        if (!node.init) return;
        recordEnvBinding(node.id, node.init);
      },

      AssignmentExpression(node) {
        if (node.left.type !== AST_NODE_TYPES.Identifier) return;
        const call = unwrapCallExpression(node.right);
        if (!call || !isTestEnvCreateCall(call)) return;
        usesTestEnv = true;
        createCalls.push(call);
        testEnvVariables.add(node.left.name);
      },

      CallExpression(node) {
        registerAfterHook(node);

        if (isTestEnvCreateCall(node)) {
          usesTestEnv = true;
          createCalls.push(node);
        }

        const teardown = isTeardownCall(node);
        if (!teardown) return;
        if (!isInsideAfterHook(node)) return;

        if (teardown.targetName && teardownAliases.has(teardown.targetName)) {
          hasTeardownInAfterHook = true;
          return;
        }

        if (testEnvVariables.size === 0) {
          hasTeardownInAfterHook = true;
          return;
        }

        if (teardown.targetName && testEnvVariables.has(teardown.targetName)) {
          hasTeardownInAfterHook = true;
        }
      },

      'Program:exit'() {
        if (!usesTestEnv || hasTeardownInAfterHook) return;

        const reportNode = createCalls[0] ?? context.sourceCode.ast;
        const envVarName = [...testEnvVariables][0] ?? 'testEnv';
        const program = sourceCode.ast;
        const lastStatement = program.body.at(-1);

        context.report({
          node: reportNode,
          messageId: 'teardownRequired',
          suggest: [
            {
              messageId: 'addTeardownHook',
              fix(fixer) {
                if (!lastStatement) return null;
                const afterAllCode = `\n\nafterAll(async () => {\n  await ${envVarName}.teardown();\n});`;
                return fixer.insertTextAfter(lastStatement, afterAllCode);
              },
            },
          ],
        });
      },
    };
  },
});
