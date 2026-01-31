/**
 * Temporal SDK package names
 */
export const TEMPORAL_PACKAGES = {
  workflow: '@temporalio/workflow',
  activity: '@temporalio/activity',
  client: '@temporalio/client',
  worker: '@temporalio/worker',
  common: '@temporalio/common',
  proto: '@temporalio/proto',
  testing: '@temporalio/testing',
} as const;

/**
 * Node.js built-in modules that are not deterministic
 * and should be blocked in workflows
 */
export const NODE_BUILTIN_MODULES = new Set([
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'fs/promises',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
]);

/**
 * NPM packages that are unsafe in workflows due to non-determinism
 * or I/O operations
 */
export const DEFAULT_UNSAFE_PACKAGES = new Set([
  // UUID/ID generation (non-deterministic)
  'uuid',
  'nanoid',
  'cuid',
  'cuid2',
  'ulid',
  'ksuid',
  'shortid',
  'hyperid',

  // Date/time (non-deterministic)
  'moment',
  'dayjs',
  'date-fns',
  'luxon',

  // HTTP clients (I/O)
  'axios',
  'node-fetch',
  'got',
  'superagent',
  'request',
  'needle',
  'undici',
  'ky',

  // Filesystem (I/O)
  'fs-extra',
  'glob',
  'globby',
  'rimraf',
  'mkdirp',
  'chokidar',

  // Environment/config (non-deterministic)
  'dotenv',
  'config',

  // Database clients (I/O)
  'pg',
  'mysql',
  'mysql2',
  'mongodb',
  'mongoose',
  'redis',
  'ioredis',
  'sequelize',
  'typeorm',
  'prisma',
  '@prisma/client',
  'knex',
  'better-sqlite3',
  'sqlite3',

  // Queue/messaging (I/O)
  'amqplib',
  'bull',
  'bullmq',
  'kafkajs',

  // Logging (can have I/O side effects)
  'winston',
  'pino',
  'bunyan',
  'log4js',

  // Utility libraries that pull in too much
  'lodash',
  'underscore',
  'ramda',
]);

/**
 * Packages that are safe to use in workflows
 * (can be used to override the deny list)
 */
export const DEFAULT_SAFE_PACKAGES = new Set([
  // Pure utility libraries
  'lodash-es',
  'remeda',
  'ts-pattern',

  // Type-only packages
  'type-fest',
  'ts-essentials',
]);

/**
 * Check if a module is a Node.js built-in
 */
export function isNodeBuiltin(moduleName: string): boolean {
  // Handle node: prefix
  const normalizedName = moduleName.startsWith('node:')
    ? moduleName.slice(5)
    : moduleName;

  return NODE_BUILTIN_MODULES.has(normalizedName);
}

/**
 * Check if a package is in the default unsafe list
 */
export function isDefaultUnsafePackage(packageName: string): boolean {
  return DEFAULT_UNSAFE_PACKAGES.has(packageName);
}

/**
 * Get the base package name from an import path
 * e.g., 'lodash/merge' -> 'lodash'
 * e.g., '@scope/pkg/sub' -> '@scope/pkg'
 */
export function getBasePackageName(importPath: string): string {
  // Handle node: prefix
  if (importPath.startsWith('node:')) {
    return importPath.slice(5).split('/')[0]!;
  }

  // Handle scoped packages
  if (importPath.startsWith('@')) {
    const parts = importPath.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return importPath;
  }

  // Regular packages
  return importPath.split('/')[0]!;
}

/**
 * Check if an import is from a Temporal SDK package
 */
export function isTemporalImport(importPath: string): boolean {
  return importPath.startsWith('@temporalio/');
}

/**
 * Check if an import is from an internal Temporal path
 * (e.g., @temporalio/workflow/lib/...)
 */
export function isTemporalInternalImport(importPath: string): boolean {
  if (!isTemporalImport(importPath)) {
    return false;
  }

  // Check for /lib/ or /src/ paths
  return /\/(lib|src)\//.test(importPath);
}
