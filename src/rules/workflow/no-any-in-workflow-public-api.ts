import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  findExportedFunctions,
  type FunctionLike,
} from '../../utilities/exported-functions.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';
import {
  collectParamTypeAnnotations,
  walkTypeNodes,
} from '../../utilities/type-utils.ts';

type MessageIds = 'noAnyInPayload';

type PayloadPosition = 'argument' | 'return';

export const noAnyInWorkflowPublicApi = createWorkflowRule<[], MessageIds>({
  name: 'workflow-no-any-in-workflow-public-api',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow any in workflow public API payload types (workflow inputs/outputs and message definitions).',
    },
    messages: {
      noAnyInPayload:
        'Avoid "any" in payload {{ position }} types. Use a concrete interface instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const handlerDefinitions = new Map<string, HandlerType>();

    function reportAny(node: TSESTree.Node, position: PayloadPosition): void {
      context.report({
        node,
        messageId: 'noAnyInPayload',
        data: {
          position,
        },
      });
    }

    function checkTypeNode(node: TSESTree.Node, position: PayloadPosition): void {
      walkTypeNodes(node, context.sourceCode, (entry) => {
        if (entry.type === AST_NODE_TYPES.TSAnyKeyword) {
          reportAny(entry, position);
        }
      });
    }

    function checkTypeAnnotation(
      annotation: TSESTree.TSTypeAnnotation | null | undefined,
      position: PayloadPosition,
    ): void {
      if (!annotation) return;
      checkTypeNode(annotation.typeAnnotation, position);
    }

    function checkFunctionTypes(node: FunctionLike, handlerType?: HandlerType): void {
      for (const param of node.params) {
        const annotations = collectParamTypeAnnotations(param);
        for (const annotation of annotations) {
          checkTypeAnnotation(annotation, 'argument');
        }
      }

      if (!handlerType || handlerType === 'query' || handlerType === 'update') {
        checkTypeAnnotation(node.returnType, 'return');
      }
    }

    function checkDefinitionTypeArguments(
      call: TSESTree.CallExpression,
      handlerType: HandlerType,
    ): void {
      const typeArgs = call.typeArguments?.params ?? [];
      if (!typeArgs.length) return;

      if (handlerType === 'signal') {
        if (typeArgs[0]) {
          checkTypeNode(typeArgs[0], 'argument');
        }
        return;
      }

      if (handlerType === 'query' || handlerType === 'update') {
        if (typeArgs[0]) {
          checkTypeNode(typeArgs[0], 'return');
        }
        if (typeArgs[1]) {
          checkTypeNode(typeArgs[1], 'argument');
        }
      }
    }

    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          !node.init ||
          node.init.type !== AST_NODE_TYPES.CallExpression
        ) {
          return;
        }

        const call = node.init;
        if (call.callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        const funcName = call.callee.name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
        if (funcName in HANDLER_DEFINITION_FUNCTIONS) {
          handlerDefinitions.set(node.id.name, HANDLER_DEFINITION_FUNCTIONS[funcName]);
        }
      },

      CallExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier) {
          const funcName = node.callee.name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
          if (funcName in HANDLER_DEFINITION_FUNCTIONS) {
            checkDefinitionTypeArguments(node, HANDLER_DEFINITION_FUNCTIONS[funcName]);
          }
        }

        if (!isSetHandlerCall(node)) {
          return;
        }

        const handlerType = getHandlerType(node, handlerDefinitions);
        if (handlerType === 'unknown') return;

        const callback = getHandlerCallback(node);
        if (!callback || callback.type === AST_NODE_TYPES.Identifier) {
          return;
        }

        checkFunctionTypes(callback, handlerType);
      },

      'Program:exit'(program: TSESTree.Program) {
        const exportedFunctions = findExportedFunctions(program).filter(
          (node) => node.async,
        );
        for (const fn of exportedFunctions) {
          checkFunctionTypes(fn);
        }
      },
    };
  },
});
