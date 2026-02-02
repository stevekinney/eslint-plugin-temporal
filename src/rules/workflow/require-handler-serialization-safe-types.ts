import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  getHandlerCallback,
  getHandlerType,
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
  isSetHandlerCall,
} from '../../utilities/handler-analysis.ts';

const DEFAULT_DISALLOWED_TYPES = [
  'date',
  'map',
  'set',
  'weakmap',
  'weakset',
  'regexp',
  'error',
  'function',
  'symbol',
  'bigint',
];

type Options = [
  {
    disallowedTypes?: string[];
    allowTypes?: string[];
  },
];

type MessageIds = 'unsafeHandlerType';

type HandlerPosition = 'argument' | 'return';

type FunctionLike =
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration;

function getTypeName(typeName: TSESTree.EntityName): string | null {
  if (typeName.type === AST_NODE_TYPES.Identifier) {
    return typeName.name;
  }
  if (typeName.type === AST_NODE_TYPES.TSQualifiedName) {
    return typeName.right.name;
  }
  return null;
}

export const requireHandlerSerializationSafeTypes = createWorkflowRule<
  Options,
  MessageIds
>({
  name: 'workflow-require-handler-serialization-safe-types',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require handler argument and return types to be serialization-safe for Temporal payloads.',
    },
    messages: {
      unsafeHandlerType:
        'Handler {{ handlerType }} {{ position }} type "{{ typeName }}" is not payload-serializable. Use JSON-serializable types or configure a custom payload converter.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          disallowedTypes: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Additional type names to treat as non-serializable in handler inputs/outputs.',
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
    const handlerDefinitions = new Map<string, HandlerType>();
    const sourceCode = context.sourceCode;

    const disallowedTypes = new Set(
      [...DEFAULT_DISALLOWED_TYPES, ...(options.disallowedTypes ?? [])].map((name) =>
        name.toLowerCase(),
      ),
    );

    for (const allowed of options.allowTypes ?? []) {
      disallowedTypes.delete(allowed.toLowerCase());
    }

    function reportUnsafe(
      node: TSESTree.Node,
      typeName: string,
      handlerType: HandlerType,
      position: HandlerPosition,
    ): void {
      if (handlerType === 'unknown') return;
      context.report({
        node,
        messageId: 'unsafeHandlerType',
        data: {
          handlerType,
          position,
          typeName,
        },
      });
    }

    function checkTypeNode(
      node: TSESTree.Node,
      handlerType: HandlerType,
      position: HandlerPosition,
      visited = new Set<TSESTree.Node>(),
    ): void {
      if (visited.has(node)) return;
      visited.add(node);

      let name: string | null = null;

      switch (node.type) {
        case AST_NODE_TYPES.TSBigIntKeyword:
          name = 'bigint';
          break;
        case AST_NODE_TYPES.TSSymbolKeyword:
          name = 'symbol';
          break;
        case AST_NODE_TYPES.TSFunctionType:
        case AST_NODE_TYPES.TSConstructorType:
        case AST_NODE_TYPES.TSMethodSignature:
        case AST_NODE_TYPES.TSCallSignatureDeclaration:
        case AST_NODE_TYPES.TSConstructSignatureDeclaration:
          name = 'function';
          break;
        case AST_NODE_TYPES.TSTypeReference:
          name = getTypeName(node.typeName);
          break;
        default:
          break;
      }

      if (name) {
        const normalized = name.toLowerCase();
        if (disallowedTypes.has(normalized)) {
          reportUnsafe(node, name, handlerType, position);
        }
      }

      const keys = sourceCode.visitorKeys[node.type] ?? Object.keys(node);
      for (const key of keys) {
        if (key === 'parent' || key === 'range' || key === 'loc') continue;
        const value = (node as unknown as Record<string, unknown>)[key];

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object' && 'type' in item) {
              checkTypeNode(item as TSESTree.Node, handlerType, position, visited);
            }
          }
        } else if (value && typeof value === 'object' && 'type' in value) {
          checkTypeNode(value as TSESTree.Node, handlerType, position, visited);
        }
      }
    }

    function checkTypeAnnotation(
      typeAnnotation: TSESTree.TSTypeAnnotation | null | undefined,
      handlerType: HandlerType,
      position: HandlerPosition,
    ): void {
      if (!typeAnnotation) return;
      checkTypeNode(typeAnnotation.typeAnnotation, handlerType, position);
    }

    function checkDefinitionTypeArguments(
      call: TSESTree.CallExpression,
      handlerType: HandlerType,
    ): void {
      const typeArgs = call.typeArguments?.params ?? [];
      if (!typeArgs.length) return;

      if (handlerType === 'signal') {
        if (typeArgs[0]) {
          checkTypeNode(typeArgs[0], handlerType, 'argument');
        }
        return;
      }

      if (handlerType === 'query' || handlerType === 'update') {
        if (typeArgs[0]) {
          checkTypeNode(typeArgs[0], handlerType, 'return');
        }
        if (typeArgs[1]) {
          checkTypeNode(typeArgs[1], handlerType, 'argument');
        }
      }
    }

    function collectParamTypes(param: TSESTree.Parameter): TSESTree.TSTypeAnnotation[] {
      const annotations: TSESTree.TSTypeAnnotation[] = [];

      if ('typeAnnotation' in param && param.typeAnnotation) {
        annotations.push(param.typeAnnotation);
      }

      if (param.type === AST_NODE_TYPES.RestElement) {
        const arg = param.argument;
        if ('typeAnnotation' in arg && arg.typeAnnotation) {
          annotations.push(arg.typeAnnotation);
        }
      }

      if (param.type === AST_NODE_TYPES.AssignmentPattern) {
        annotations.push(...collectParamTypes(param.left));
      }

      return annotations;
    }

    function checkFunctionTypes(node: FunctionLike, handlerType: HandlerType): void {
      for (const param of node.params) {
        const annotations = collectParamTypes(param);
        for (const annotation of annotations) {
          checkTypeAnnotation(annotation, handlerType, 'argument');
        }
      }

      if (handlerType === 'query' || handlerType === 'update') {
        checkTypeAnnotation(node.returnType, handlerType, 'return');
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
            const handlerType = HANDLER_DEFINITION_FUNCTIONS[funcName];
            checkDefinitionTypeArguments(node, handlerType);
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
    };
  },
});
