import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createRule } from '../../utilities/create-rule.ts';

type Options = [
  {
    httpClients?: string[];
  },
];

type MessageIds = 'missingSignal';

const DEFAULT_HTTP_CLIENTS = ['fetch', 'axios', 'got', 'ky'];

export const useCancellationSignal = createRule<Options, MessageIds>({
  name: 'use-cancellation-signal',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest passing cancellation signal to HTTP clients in activities.',
    },
    messages: {
      missingSignal:
        'Consider passing Context.current().cancellationSignal to {{ client }}(). This allows the HTTP request to be cancelled when the activity is cancelled. Example: fetch(url, { signal: Context.current().cancellationSignal })',
    },
    schema: [
      {
        type: 'object',
        properties: {
          httpClients: {
            type: 'array',
            items: { type: 'string' },
            description: 'HTTP client function names to check',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const httpClients = new Set(options.httpClients ?? DEFAULT_HTTP_CLIENTS);

    return {
      CallExpression(node) {
        const clientName = getClientName(node);
        if (!clientName || !httpClients.has(clientName)) {
          return;
        }

        // Check for signal in options
        if (hasSignalOption(node, clientName)) {
          return;
        }

        context.report({
          node,
          messageId: 'missingSignal',
          data: { client: clientName },
        });
      },
    };
  },
});

/**
 * Get the HTTP client name from a call expression
 */
function getClientName(node: TSESTree.CallExpression): string | null {
  const { callee } = node;

  // Direct call: fetch(), axios(), etc.
  if (callee.type === AST_NODE_TYPES.Identifier) {
    return callee.name;
  }

  // Member expression: axios.get(), got.get(), ky.get()
  if (callee.type === AST_NODE_TYPES.MemberExpression) {
    if (callee.object.type === AST_NODE_TYPES.Identifier) {
      return callee.object.name;
    }
  }

  return null;
}

/**
 * Check if the call has a signal option
 */
function hasSignalOption(node: TSESTree.CallExpression, clientName: string): boolean {
  // fetch(url, { signal: ... })
  if (clientName === 'fetch') {
    const optionsArg = node.arguments[1];
    if (optionsArg?.type === AST_NODE_TYPES.ObjectExpression) {
      return hasProperty(optionsArg, 'signal');
    }
    return false;
  }

  // axios(config) or axios.get(url, config)
  if (clientName === 'axios') {
    // Could be axios(config) or axios.get(url, config)
    for (const arg of node.arguments) {
      if (arg.type === AST_NODE_TYPES.ObjectExpression) {
        if (hasProperty(arg, 'signal') || hasProperty(arg, 'cancelToken')) {
          return true;
        }
      }
    }
    return false;
  }

  // got, ky - similar patterns
  for (const arg of node.arguments) {
    if (arg.type === AST_NODE_TYPES.ObjectExpression) {
      if (hasProperty(arg, 'signal')) {
        return true;
      }
    }
  }

  return false;
}
