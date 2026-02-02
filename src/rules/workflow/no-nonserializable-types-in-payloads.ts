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
    disallowedTypes?: string[];
    allowTypes?: string[];
  },
];

type MessageIds = 'nonSerializableType';

type PayloadPosition = 'argument' | 'return';

const DEFAULT_DISALLOWED_TYPES = [
  'function',
  'symbol',
  'map',
  'set',
  'weakmap',
  'weakset',
  'regexp',
];

function isNonSerializableTypeNode(node: TSESTree.Node): string | null {
  switch (node.type) {
    case AST_NODE_TYPES.TSFunctionType:
    case AST_NODE_TYPES.TSConstructorType:
    case AST_NODE_TYPES.TSCallSignatureDeclaration:
    case AST_NODE_TYPES.TSConstructSignatureDeclaration:
    case AST_NODE_TYPES.TSMethodSignature:
      return 'function';
    case AST_NODE_TYPES.TSSymbolKeyword:
      return 'symbol';
    case AST_NODE_TYPES.TSTypeReference: {
      const name = getTypeName(node.typeName);
      return name;
    }
    default:
      return null;
  }
}

export const noNonserializableTypesInPayloads = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-nonserializable-types-in-payloads',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow non-serializable types (functions, symbols, Map/Set, RegExp, etc.) in workflow payloads.',
    },
    messages: {
      nonSerializableType:
        'Payload {{ position }} type "{{ typeName }}" is not serializable. Use JSON-serializable types or configure a custom payload converter.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          disallowedTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional type names to treat as non-serializable.',
          },
          allowTypes: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Type names to allow that would otherwise be treated as non-serializable.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const sourceCode = context.sourceCode;
    const handlerDefinitions = new Map<string, HandlerType>();

    const disallowedTypes = new Set(
      [...DEFAULT_DISALLOWED_TYPES, ...(options.disallowedTypes ?? [])].map((name) =>
        name.toLowerCase(),
      ),
    );

    for (const allowed of options.allowTypes ?? []) {
      disallowedTypes.delete(allowed.toLowerCase());
    }

    function reportType(
      node: TSESTree.Node,
      typeName: string,
      position: PayloadPosition,
    ) {
      context.report({
        node,
        messageId: 'nonSerializableType',
        data: {
          typeName,
          position,
        },
      });
    }

    function checkTypeNode(node: TSESTree.Node, position: PayloadPosition): void {
      walkTypeNodes(node, sourceCode, (entry) => {
        const name = isNonSerializableTypeNode(entry);
        if (!name) return;
        const normalized = name.toLowerCase();
        if (!disallowedTypes.has(normalized)) return;
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
