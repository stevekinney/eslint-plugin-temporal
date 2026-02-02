import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

type MessageIds = 'messageNameLiteral';

const MESSAGE_DEFINITION_FUNCTIONS = new Set([
  'defineSignal',
  'defineQuery',
  'defineUpdate',
]);

export const messageNameLiteral = createWorkflowRule<[], MessageIds>({
  name: 'workflow-message-name-literal',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require literal string names in defineSignal, defineQuery, and defineUpdate calls. Dynamic names can cause issues with workflow versioning and tooling.',
    },
    messages: {
      messageNameLiteral:
        'Message names in {{ functionName }}() should be string literals or constants. Dynamic names make it harder to track message types across versions and can cause issues with workflow tooling.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track const declarations that can be used as valid names
    const constStringDeclarations = new Set<string>();

    function isValidMessageName(node: TSESTree.CallExpressionArgument): boolean {
      // String literal is valid
      if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
        return true;
      }

      // Template literal with no expressions is valid
      if (node.type === AST_NODE_TYPES.TemplateLiteral && node.expressions.length === 0) {
        return true;
      }

      // Reference to a const string declaration is valid
      if (
        node.type === AST_NODE_TYPES.Identifier &&
        constStringDeclarations.has(node.name)
      ) {
        return true;
      }

      // "as const" assertion with a string literal is valid
      if (
        node.type === AST_NODE_TYPES.TSAsExpression &&
        node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
        node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
        node.typeAnnotation.typeName.name === 'const'
      ) {
        return isValidMessageName(node.expression as TSESTree.CallExpressionArgument);
      }

      return false;
    }

    return {
      // Track const string declarations
      VariableDeclaration(node) {
        if (node.kind !== 'const') {
          return;
        }

        for (const declarator of node.declarations) {
          if (
            declarator.id.type === AST_NODE_TYPES.Identifier &&
            declarator.init?.type === AST_NODE_TYPES.Literal &&
            typeof declarator.init.value === 'string'
          ) {
            constStringDeclarations.add(declarator.id.name);
          }
        }
      },

      CallExpression(node) {
        // Check if this is a call to defineSignal, defineQuery, or defineUpdate
        let functionName: string | null = null;

        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          MESSAGE_DEFINITION_FUNCTIONS.has(node.callee.name)
        ) {
          functionName = node.callee.name;
        }
        // Note: We only check direct calls (e.g., defineSignal()), not member expressions
        // (e.g., otherLib.defineSignal()) because those are likely from other libraries

        if (!functionName) {
          return;
        }

        // The first argument should be the message name
        const firstArg = node.arguments[0];
        if (!firstArg) {
          return; // Let TypeScript handle missing arguments
        }

        if (!isValidMessageName(firstArg)) {
          context.report({
            node: firstArg,
            messageId: 'messageNameLiteral',
            data: {
              functionName,
            },
          });
        }
      },
    };
  },
});
