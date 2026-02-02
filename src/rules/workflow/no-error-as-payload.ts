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
    allowTypes?: string[];
  },
];

type MessageIds = 'errorPayload';

type PayloadPosition = 'argument' | 'return';

const DEFAULT_ERROR_TYPES = [
  'error',
  'typeerror',
  'rangeerror',
  'referenceerror',
  'syntaxerror',
  'evalerror',
  'aggregateerror',
];

function isErrorTypeName(name: string): boolean {
  const normalized = name.toLowerCase();
  if (DEFAULT_ERROR_TYPES.includes(normalized)) return true;
  return normalized.endsWith('error');
}

export const noErrorAsPayload = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-error-as-payload',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow Error objects in workflow payload types. Use structured error shapes instead.',
    },
    messages: {
      errorPayload:
        'Payload {{ position }} type "{{ typeName }}" is an Error. Convert errors to serializable shapes (e.g., { name, message, stack }) instead of passing Error objects.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Error-like type names to allow in payloads.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const handlerDefinitions = new Map<string, HandlerType>();
    const allowTypes = new Set(
      (options.allowTypes ?? []).map((name) => name.toLowerCase()),
    );

    function reportType(
      node: TSESTree.Node,
      typeName: string,
      position: PayloadPosition,
    ) {
      context.report({
        node,
        messageId: 'errorPayload',
        data: {
          typeName,
          position,
        },
      });
    }

    function checkTypeNode(node: TSESTree.Node, position: PayloadPosition): void {
      walkTypeNodes(node, context.sourceCode, (entry) => {
        if (entry.type !== AST_NODE_TYPES.TSTypeReference) return;
        const name = getTypeName(entry.typeName);
        if (!name) return;
        const normalized = name.toLowerCase();
        if (allowTypes.has(normalized)) return;
        if (!isErrorTypeName(name)) return;
        reportType(entry, name, position);
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
