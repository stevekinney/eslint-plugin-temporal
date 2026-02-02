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
  getTypeName,
  walkTypeNodes,
} from '../../utilities/type-utils.ts';

type Options = [
  {
    allowBigInt?: boolean;
  },
];

type MessageIds = 'bigintPayload';

type PayloadPosition = 'argument' | 'return';

function isBigIntTypeNode(node: TSESTree.Node): boolean {
  if (node.type === AST_NODE_TYPES.TSBigIntKeyword) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.TSTypeReference) {
    const name = getTypeName(node.typeName);
    return name === 'BigInt';
  }

  return false;
}

export const noBigintInPayload = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-bigint-in-payload',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow bigint in workflow payload types unless a custom payload converter is configured.',
    },
    messages: {
      bigintPayload:
        'Payload {{ position }} type "bigint" is not JSON-serializable. Convert to string/number or configure a custom payload converter.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowBigInt: {
            type: 'boolean',
            description: 'Allow bigint types in payloads (for custom converters).',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    if (options.allowBigInt) {
      return {};
    }

    const handlerDefinitions = new Map<string, HandlerType>();

    function reportType(node: TSESTree.Node, position: PayloadPosition) {
      context.report({
        node,
        messageId: 'bigintPayload',
        data: {
          position,
        },
      });
    }

    function checkTypeNode(node: TSESTree.Node, position: PayloadPosition): void {
      walkTypeNodes(node, context.sourceCode, (entry) => {
        if (!isBigIntTypeNode(entry)) return;
        reportType(entry, position);
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
