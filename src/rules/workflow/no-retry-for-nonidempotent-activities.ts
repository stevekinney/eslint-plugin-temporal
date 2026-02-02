import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

import { getProperty } from '../../utilities/ast-helpers.ts';
import { createWorkflowRule } from '../../utilities/create-context-rule.ts';

const DEFAULT_PATTERNS = ['charge*', 'send*', 'create*'];
const DEFAULT_TAG = '@nonIdempotent';

type Options = [
  {
    activityPatterns?: string[];
    tag?: string;
  },
];

type MessageIds = 'noRetryForNonIdempotent';

type RetryInfo = { known: false } | { known: true; hasMaxAttemptsOne: boolean };

export const noRetryForNonIdempotentActivities = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-retry-for-nonidempotent-activities',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require non-idempotent activities to use retry.maximumAttempts: 1.',
    },
    messages: {
      noRetryForNonIdempotent:
        'Activity "{{ name }}" appears non-idempotent. Configure proxyActivities with retry: { maximumAttempts: 1 } (or use a dedicated proxy for this activity).',
    },
    schema: [
      {
        type: 'object',
        properties: {
          activityPatterns: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Activity name patterns that should be treated as non-idempotent (supports * wildcards).',
          },
          tag: {
            type: 'string',
            description:
              'JSDoc/comment tag that marks an activity call as non-idempotent (default: @nonIdempotent).',
          },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ activityPatterns: DEFAULT_PATTERNS, tag: DEFAULT_TAG }],
  },
  defaultOptions: [{ activityPatterns: DEFAULT_PATTERNS, tag: DEFAULT_TAG }],
  create(context, [options]) {
    const sourceCode = context.sourceCode;
    const patterns = options.activityPatterns ?? DEFAULT_PATTERNS;
    const tag = options.tag ?? DEFAULT_TAG;
    const patternRegexes = compilePatterns(patterns);

    const proxyByName = new Map<string, RetryInfo>();
    const directActivityFns = new Map<string, RetryInfo>();

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

    function getRetryInfo(optionsArg: TSESTree.CallExpressionArgument | null): RetryInfo {
      if (!optionsArg) return { known: true, hasMaxAttemptsOne: false };
      if (optionsArg.type !== AST_NODE_TYPES.ObjectExpression) {
        return { known: false };
      }

      const retryProp = getProperty(optionsArg, 'retry');
      if (!retryProp) {
        return { known: true, hasMaxAttemptsOne: false };
      }

      if (retryProp.value.type !== AST_NODE_TYPES.ObjectExpression) {
        return { known: false };
      }

      const maxProp = getProperty(retryProp.value, 'maximumAttempts');
      if (!maxProp) {
        return { known: true, hasMaxAttemptsOne: false };
      }

      if (maxProp.value.type === AST_NODE_TYPES.Literal) {
        if (typeof maxProp.value.value === 'number') {
          return { known: true, hasMaxAttemptsOne: maxProp.value.value === 1 };
        }
        if (typeof maxProp.value.value === 'string') {
          const parsed = Number(maxProp.value.value);
          if (!Number.isNaN(parsed)) {
            return { known: true, hasMaxAttemptsOne: parsed === 1 };
          }
        }
      }

      return { known: false };
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

    function getProxyName(node: TSESTree.CallExpression): string | null {
      if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
        const object = node.callee.object;
        if (object.type === AST_NODE_TYPES.Identifier) {
          return object.name;
        }
      }
      return null;
    }

    function hasNonIdempotentTag(node: TSESTree.Node): boolean {
      const commentTag = tag.trim();
      if (!commentTag) return false;

      const pattern = new RegExp(escapeRegex(commentTag), 'i');
      const targets = new Set<TSESTree.Node>([node]);

      if (node.parent) {
        targets.add(node.parent);
        if (node.parent.parent) {
          targets.add(node.parent.parent);
        }
      }

      const comments = [...targets].flatMap((target) => [
        ...sourceCode.getCommentsBefore(target),
        ...sourceCode.getCommentsAfter(target),
      ]);

      return comments.some((comment) => {
        if (!comment.loc || !node.loc) return false;
        const lineDelta = Math.abs(comment.loc.end.line - node.loc.start.line);
        if (lineDelta > 1) return false;
        return pattern.test(comment.value);
      });
    }

    function matchesPattern(name: string): boolean {
      if (!patternRegexes.length) return false;
      return patternRegexes.some((regex) => regex.test(name));
    }

    function report(node: TSESTree.Node, name: string): void {
      context.report({ node, messageId: 'noRetryForNonIdempotent', data: { name } });
    }

    return {
      VariableDeclarator(node) {
        if (!node.init || node.init.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isProxyActivitiesCall(node.init)) return;

        const retryInfo = getRetryInfo(node.init.arguments[0] ?? null);

        if (node.id.type === AST_NODE_TYPES.Identifier) {
          proxyByName.set(node.id.name, retryInfo);
          return;
        }

        if (node.id.type === AST_NODE_TYPES.ObjectPattern) {
          for (const property of node.id.properties) {
            if (
              property.type === AST_NODE_TYPES.Property &&
              property.key.type === AST_NODE_TYPES.Identifier
            ) {
              directActivityFns.set(property.key.name, retryInfo);
            }
          }
        }
      },
      CallExpression(node) {
        const activityName = getActivityName(node);
        if (!activityName) return;

        let retryInfo: RetryInfo | undefined;
        const proxyName = getProxyName(node);

        if (proxyName) {
          retryInfo = proxyByName.get(proxyName);
        } else if (node.callee.type === AST_NODE_TYPES.Identifier) {
          retryInfo = directActivityFns.get(node.callee.name);
        }

        if (!retryInfo) return;

        const isFlagged = matchesPattern(activityName) || hasNonIdempotentTag(node);
        if (!isFlagged) return;

        if (!retryInfo.known) return;
        if (retryInfo.hasMaxAttemptsOne) return;

        report(node, activityName);
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
