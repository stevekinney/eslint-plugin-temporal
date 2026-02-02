import type { TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createWorkflowRule } from '../../utilities/create-context-rule.ts';
import {
  DEFAULT_SAFE_PACKAGES,
  getBasePackageName,
  isDefaultUnsafePackage,
  isNodeBuiltin,
} from '../../utilities/temporal-packages.ts';

type Options = [
  {
    denyImports?: string[];
    allowImports?: string[];
  },
];

type MessageIds = 'unsafePackageImport';

export const noUnsafePackageImports = createWorkflowRule<Options, MessageIds>({
  name: 'workflow-no-unsafe-package-imports',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing packages that are unsafe for workflow determinism.',
    },
    messages: {
      unsafePackageImport:
        "Package '{{ package }}' is not safe for workflows. {{ reason }}",
    },
    schema: [
      {
        type: 'object',
        properties: {
          denyImports: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional packages to deny',
          },
          allowImports: {
            type: 'array',
            items: { type: 'string' },
            description: 'Packages to allow that would otherwise be denied',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const denySet = new Set(options.denyImports ?? []);
    const allowSet = new Set([...DEFAULT_SAFE_PACKAGES, ...(options.allowImports ?? [])]);

    function checkImport(
      node: TSESTree.ImportDeclaration | TSESTree.ImportExpression,
      importSource: string,
    ) {
      // Skip Node.js built-ins (handled by no-node-or-dom-imports)
      if (isNodeBuiltin(importSource)) {
        return;
      }

      // Skip relative imports
      if (importSource.startsWith('.')) {
        return;
      }

      // Skip Temporal SDK imports
      if (importSource.startsWith('@temporalio/')) {
        return;
      }

      const basePackage = getBasePackageName(importSource);

      // Check if explicitly allowed
      if (allowSet.has(basePackage) || allowSet.has(importSource)) {
        return;
      }

      // Check if explicitly denied
      if (denySet.has(basePackage) || denySet.has(importSource)) {
        context.report({
          node,
          messageId: 'unsafePackageImport',
          data: {
            package: basePackage,
            reason: 'This package is explicitly denied in workflow files.',
          },
        });
        return;
      }

      // Check against default unsafe packages
      if (isDefaultUnsafePackage(basePackage)) {
        const reason = getUnsafeReason(basePackage);
        context.report({
          node,
          messageId: 'unsafePackageImport',
          data: {
            package: basePackage,
            reason,
          },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        checkImport(node, node.source.value);
      },
      ImportExpression(node) {
        if (
          node.source.type === AST_NODE_TYPES.Literal &&
          typeof node.source.value === 'string'
        ) {
          checkImport(node, node.source.value);
        }
      },
    };
  },
});

/**
 * Get a human-readable reason why a package is unsafe
 */
function getUnsafeReason(packageName: string): string {
  const reasons: Record<string, string> = {
    // UUID/ID generation
    uuid: 'UUID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    nanoid:
      'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    cuid: 'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    cuid2:
      'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    ulid: 'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    ksuid:
      'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    shortid:
      'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',
    hyperid:
      'ID generation is non-deterministic. Use uuid4() from @temporalio/workflow instead.',

    // Date/time
    moment:
      'Date/time operations are non-deterministic. Use Temporal workflow time APIs instead.',
    dayjs:
      'Date/time operations are non-deterministic. Use Temporal workflow time APIs instead.',
    'date-fns':
      'Date/time operations are non-deterministic. Use Temporal workflow time APIs instead.',
    luxon:
      'Date/time operations are non-deterministic. Use Temporal workflow time APIs instead.',

    // HTTP clients
    axios: 'HTTP requests are not allowed in workflows. Use activities instead.',
    'node-fetch': 'HTTP requests are not allowed in workflows. Use activities instead.',
    got: 'HTTP requests are not allowed in workflows. Use activities instead.',
    superagent: 'HTTP requests are not allowed in workflows. Use activities instead.',
    request: 'HTTP requests are not allowed in workflows. Use activities instead.',
    needle: 'HTTP requests are not allowed in workflows. Use activities instead.',
    undici: 'HTTP requests are not allowed in workflows. Use activities instead.',
    ky: 'HTTP requests are not allowed in workflows. Use activities instead.',

    // Filesystem
    'fs-extra':
      'Filesystem operations are not allowed in workflows. Use activities instead.',
    glob: 'Filesystem operations are not allowed in workflows. Use activities instead.',
    globby: 'Filesystem operations are not allowed in workflows. Use activities instead.',
    rimraf: 'Filesystem operations are not allowed in workflows. Use activities instead.',
    mkdirp: 'Filesystem operations are not allowed in workflows. Use activities instead.',
    chokidar:
      'Filesystem operations are not allowed in workflows. Use activities instead.',

    // Environment/config
    dotenv:
      'Environment access is non-deterministic. Pass configuration as workflow arguments.',
    config:
      'Configuration loading is non-deterministic. Pass configuration as workflow arguments.',

    // Database
    pg: 'Database operations are not allowed in workflows. Use activities instead.',
    mysql: 'Database operations are not allowed in workflows. Use activities instead.',
    mysql2: 'Database operations are not allowed in workflows. Use activities instead.',
    mongodb: 'Database operations are not allowed in workflows. Use activities instead.',
    mongoose: 'Database operations are not allowed in workflows. Use activities instead.',
    redis: 'Database operations are not allowed in workflows. Use activities instead.',
    ioredis: 'Database operations are not allowed in workflows. Use activities instead.',
    sequelize:
      'Database operations are not allowed in workflows. Use activities instead.',
    typeorm: 'Database operations are not allowed in workflows. Use activities instead.',
    prisma: 'Database operations are not allowed in workflows. Use activities instead.',
    '@prisma/client':
      'Database operations are not allowed in workflows. Use activities instead.',
    knex: 'Database operations are not allowed in workflows. Use activities instead.',
    'better-sqlite3':
      'Database operations are not allowed in workflows. Use activities instead.',
    sqlite3: 'Database operations are not allowed in workflows. Use activities instead.',

    // Queue/messaging
    amqplib:
      'Message queue operations are not allowed in workflows. Use activities instead.',
    bull: 'Message queue operations are not allowed in workflows. Use activities instead.',
    bullmq:
      'Message queue operations are not allowed in workflows. Use activities instead.',
    kafkajs:
      'Message queue operations are not allowed in workflows. Use activities instead.',

    // Logging
    winston:
      'External logging has I/O side effects. Use log from @temporalio/workflow instead.',
    pino: 'External logging has I/O side effects. Use log from @temporalio/workflow instead.',
    bunyan:
      'External logging has I/O side effects. Use log from @temporalio/workflow instead.',
    log4js:
      'External logging has I/O side effects. Use log from @temporalio/workflow instead.',

    // Utility libraries
    lodash:
      'Lodash imports many modules that may not be deterministic. Use lodash-es or specific functions.',
    underscore: 'May contain non-deterministic functions.',
    ramda: 'May contain non-deterministic functions.',
  };

  return reasons[packageName] ?? 'This package may contain non-deterministic code.';
}
