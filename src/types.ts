import type { TSESTree } from '@typescript-eslint/utils';

/**
 * The type of Temporal context a file operates in
 */
export type TemporalFileType =
  | 'workflow'
  | 'activity'
  | 'worker'
  | 'client'
  | 'test'
  | 'shared'
  | 'unknown';

/**
 * Import information tracked for a source
 */
export interface TrackedImport {
  source: string;
  specifiers: ImportSpecifier[];
  isTypeOnly: boolean;
  node: TSESTree.ImportDeclaration;
}

/**
 * An individual import specifier
 */
export interface ImportSpecifier {
  imported: string;
  local: string;
  isTypeOnly: boolean;
}

/**
 * Plugin-wide settings that can be configured in eslint.config.js
 */
export interface TemporalPluginSettings {
  workflow?: WorkflowSettings;
  activity?: ActivitySettings;
  taskQueuePattern?: string;
  filePatterns?: FilePatterns;
}

/**
 * Workflow-specific settings
 */
export interface WorkflowSettings {
  /** Additional packages to deny in workflows */
  denyImports?: string[];
  /** Packages to allow that would otherwise be denied */
  allowImports?: string[];
  /** Glob patterns for activity directories (default: ['**\/activities/**']) */
  activityDirectories?: string[];
}

/**
 * Activity-specific settings
 */
export interface ActivitySettings {
  /** API calls that should have idempotency keys */
  idempotencyKeyApis?: string[];
  /** HTTP client function names to check for cancellation signals */
  httpClients?: string[];
}

/**
 * File pattern settings for auto-detecting Temporal context
 */
export interface FilePatterns {
  workflow?: string[];
  activity?: string[];
  worker?: string[];
  client?: string[];
  test?: string[];
}

/**
 * Rule message IDs for type safety
 */
export type MessageIds<T extends string> = T;

/**
 * Rule options type helper
 */
export type RuleOptions<T = []> = T extends [] ? [] : [T];

/**
 * Console method to workflow log method mapping
 */
export const CONSOLE_TO_LOG_MAP: Record<string, string> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
  trace: 'trace',
};

/**
 * Default file patterns for detecting Temporal contexts
 */
export const DEFAULT_FILE_PATTERNS: Required<FilePatterns> = {
  workflow: ['**/workflows/**', '**/*.workflow.ts', '**/*.workflows.ts'],
  activity: ['**/activities/**', '**/*.activity.ts', '**/*.activities.ts'],
  worker: ['**/worker/**', '**/*.worker.ts', '**/workers/**'],
  client: ['**/client/**', '**/*.client.ts', '**/clients/**'],
  test: ['**/*.test.ts', '**/*.spec.ts', '**/test/**', '**/__tests__/**'],
};
