import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import type { TemporalPluginSettings } from '../../types.ts';
import { hasProperty } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

const DEFAULT_PATTERNS = ['charge*', 'send*', 'create*'];
const DEFAULT_KEYS = ['idempotencyKey'];

const WORKFLOW_ID_KEYS = ['workflowId', 'runId'];

type Options = [
  {
    activityPatterns?: string[];
    keyFields?: string[];
    allowWorkflowIdentifiers?: boolean;
  },
];

type MessageIds = 'missingIdempotencyKey';

export const requireIdempotencyKeyArg = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-require-idempotency-key-arg',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require an idempotency key (or workflow identifiers) when calling non-idempotent activities.',
    },
    messages: {
      missingIdempotencyKey:
        'Activity "{{ name }}" appears non-idempotent. Include an idempotency key in the activity input (e.g., idempotencyKey, workflowId, runId).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          activityPatterns: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Activity name patterns that should require idempotency keys (supports * wildcards).',
          },
          keyFields: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Allowed idempotency key field names on the activity input object.',
          },
          allowWorkflowIdentifiers: {
            type: 'boolean',
            description:
              'Whether workflowId/runId can satisfy the idempotency key requirement.',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{}],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const settings = context.settings?.['temporal'] as TemporalPluginSettings | undefined;
    const patterns =
      options.activityPatterns ??
      settings?.activity?.idempotencyKeyApis ??
      DEFAULT_PATTERNS;
    const patternRegexes = compilePatterns(patterns);

    const keyFields = options.keyFields ?? DEFAULT_KEYS;
    const allowWorkflowIdentifiers = options.allowWorkflowIdentifiers ?? true;
    const acceptedKeys = new Set([
      ...keyFields,
      ...(allowWorkflowIdentifiers ? WORKFLOW_ID_KEYS : []),
    ]);

    const activityProxyVariables = new Set<string>();
    const directActivityFns = new Set<string>();

    function isProxyActivitiesCall(node: TSESTree.CallExpression): boolean {
      if (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        (node.callee.name === 'proxyActivities' ||
          node.callee.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      if (
        node.callee.type === AST_NODE_TYPES.MemberExpression &&
        node.callee.property.type === AST_NODE_TYPES.Identifier &&
        (node.callee.property.name === 'proxyActivities' ||
          node.callee.property.name === 'proxyLocalActivities')
      ) {
        return true;
      }

      return false;
    }

    function matchesPattern(name: string): boolean {
      if (!patternRegexes.length) return false;
      return patternRegexes.some((regex) => regex.test(name));
    }

    function getActivityName(node: TSESTree.CallExpression): string | null {
      const { callee } = node;

      if (callee.type === AST_NODE_TYPES.Identifier) {
        return callee.name;
      }

      if (callee.type === AST_NODE_TYPES.MemberExpression) {
        if (callee.property.type === AST_NODE_TYPES.Identifier) {
          return callee.property.name;
        }
        if (
          callee.property.type === AST_NODE_TYPES.Literal &&
          typeof callee.property.value === 'string'
        ) {
          return callee.property.value;
        }
      }

      return null;
    }

    function isActivityCall(node: TSESTree.CallExpression): boolean {
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        if (node.callee.object.type === AST_NODE_TYPES.Identifier) {
          return activityProxyVariables.has(node.callee.object.name);
        }
      }

      if (node.callee.type === AST_NODE_TYPES.Identifier) {
        return directActivityFns.has(node.callee.name);
      }

      return false;
    }

    function hasAcceptedKey(node: TSESTree.ObjectExpression): boolean {
      return [...acceptedKeys].some((key) => hasProperty(node, key));
    }

    return {
      VariableDeclarator(node) {
        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isProxyActivitiesCall(node.init)) return;

        if (node.id.type === AST_NODE_TYPES.Identifier) {
          activityProxyVariables.add(node.id.name);
          return;
        }

        if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
          for (const property of node.id.properties) {
            if (
              property.type === AST_NODE_TYPES.Property &&
              property.key.type === AST_NODE_TYPES.Identifier
            ) {
              directActivityFns.add(property.key.name);
            }
          }
        }
      },
      CallExpression(node) {
        if (!isActivityCall(node)) return;

        const activityName = getActivityName(node);
        if (!activityName || !matchesPattern(activityName)) return;

        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== AST_NODE_TYPES.ObjectExpression) return;

        if (hasAcceptedKey(firstArg)) return;

        context.report({
          node,
          messageId: 'missingIdempotencyKey',
          data: { name: activityName },
        });
      },
    };
  },
});

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePatterns(patterns: string[]): RegExp[] {
  return patterns
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .map((pattern) => {
      if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) {
        return new RegExp(pattern.slice(1, -1), 'i');
      }

      const escaped = escapeRegex(pattern);
      const regex = `^${escaped.replace(/\\\*/g, '.*')}$`;
      return new RegExp(regex, 'i');
    });
}
