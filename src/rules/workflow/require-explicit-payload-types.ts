import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  findExportedFunctions,
  type FunctionLike,
} from '../../utilities/exported-functions.ts';
import {
  HANDLER_DEFINITION_FUNCTIONS,
  type HandlerType,
} from '../../utilities/handler-analysis.ts';
import { collectParamTypeAnnotations } from '../../utilities/type-utils.ts';

type MessageIds = 'missingParamType' | 'missingReturnType' | 'missingMessageTypes';

const REQUIRED_TYPE_ARGS: Record<HandlerType, number> = {
  signal: 1,
  query: 2,
  update: 2,
  unknown: 0,
};

export const requireExplicitPayloadTypes = createWorkflowRule<[], MessageIds>({
  name: 'workflow-require-explicit-payload-types',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require explicit payload types for workflow inputs/outputs and message definitions.',
    },
    messages: {
      missingParamType:
        'Workflow parameter "{{ name }}" should have an explicit payload type annotation.',
      missingReturnType:
        'Workflow return type should be explicitly annotated to document payload shape.',
      missingMessageTypes:
        '{{ functionName }}() should declare explicit payload types (for example: defineSignal<[Args]>(), defineQuery<Result, Args>()).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkWorkflowFunction(node: FunctionLike): void {
      if (!node.async) return;

      for (const param of node.params) {
        const annotations = collectParamTypeAnnotations(param);
        if (annotations.length === 0) {
          const name =
            param.type === AST_NODE_TYPES.Identifier ? param.name : 'parameter';
          context.report({
            node: param,
            messageId: 'missingParamType',
            data: { name },
          });
        }
      }

      if (!node.returnType) {
        context.report({
          node,
          messageId: 'missingReturnType',
        });
      }
    }

    function checkMessageDefinition(node: TSESTree.CallExpression): void {
      if (node.callee.type !== AST_NODE_TYPES.Identifier) return;
      const funcName = node.callee.name as keyof typeof HANDLER_DEFINITION_FUNCTIONS;
      if (!(funcName in HANDLER_DEFINITION_FUNCTIONS)) return;

      const handlerType = HANDLER_DEFINITION_FUNCTIONS[funcName];
      const required = REQUIRED_TYPE_ARGS[handlerType];
      const provided = node.typeArguments?.params.length ?? 0;

      if (required > 0 && provided < required) {
        context.report({
          node,
          messageId: 'missingMessageTypes',
          data: { functionName: funcName },
        });
      }
    }

    return {
      CallExpression: checkMessageDefinition,

      'Program:exit'(program: TSESTree.Program) {
        const exportedFunctions = findExportedFunctions(program).filter(
          (node) => node.async,
        );
        for (const fn of exportedFunctions) {
          checkWorkflowFunction(fn);
        }
      },
    };
  },
});
