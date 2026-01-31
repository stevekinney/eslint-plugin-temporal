import type { FilePatterns, TemporalFileType } from '../types.ts';
import { DEFAULT_FILE_PATTERNS } from '../types.ts';

/**
 * Convert a glob pattern to a regex pattern
 */
function globToRegex(glob: string): RegExp {
  const regexStr = glob
    // Escape special regex characters except * and ?
    .replaceAll(/[.+^${}()|[\]\\]/g, '\\$&')
    // Convert ** to match any path
    .replaceAll('**', '.*')
    // Convert * to match anything except /
    .replaceAll(/(?<!\.)(\*)/g, '[^/]*')
    // Convert ? to match single character
    .replaceAll('?', '.');

  return new RegExp(regexStr);
}

/**
 * Check if a file path matches any of the given glob patterns
 */
function matchesPatterns(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = globToRegex(pattern);
    return regex.test(filePath);
  });
}

/**
 * Detect the Temporal context type from a file path
 *
 * @param filePath - The absolute or relative file path
 * @param customPatterns - Optional custom patterns to use instead of defaults
 * @returns The detected Temporal file type
 */
export function detectTemporalFileType(
  filePath: string,
  customPatterns?: FilePatterns,
): TemporalFileType {
  const patterns = {
    ...DEFAULT_FILE_PATTERNS,
    ...customPatterns,
  };

  // Normalize path separators for cross-platform support
  const normalizedPath = filePath.replaceAll('\\', '/');

  // Check each type in priority order
  // Workflow and activity are more specific, check them first
  if (matchesPatterns(normalizedPath, patterns.workflow)) {
    return 'workflow';
  }

  if (matchesPatterns(normalizedPath, patterns.activity)) {
    return 'activity';
  }

  if (matchesPatterns(normalizedPath, patterns.worker)) {
    return 'worker';
  }

  if (matchesPatterns(normalizedPath, patterns.client)) {
    return 'client';
  }

  return 'unknown';
}

/**
 * Check if a path looks like it could be an activity directory
 */
export function isActivityPath(
  importPath: string,
  activityDirectories: string[] = ['**/activities/**'],
): boolean {
  return matchesPatterns(importPath, activityDirectories);
}

/**
 * Check if an import path looks like a relative import to activities
 */
export function isRelativeActivityImport(
  importSource: string,
  _currentFilePath: string,
  activityDirectories: string[] = ['**/activities/**', '**/*.activities.ts'],
): boolean {
  // Only check relative imports
  if (!importSource.startsWith('.')) {
    return false;
  }

  // Check if import path contains activity-related patterns
  const activityPatterns = [
    /\/activities(\/|$)/,
    /\.activities$/,
    /\/activity(\/|$)/,
    /\.activity$/,
  ];

  // Check the import source itself
  if (activityPatterns.some((pattern) => pattern.test(importSource))) {
    return true;
  }

  // Also check if the resolved path would be in an activity directory
  // This is a heuristic - for more accurate detection, you'd need
  // to resolve the full path
  return activityDirectories.some((dir) => {
    // Convert glob pattern to a simpler check
    const simplePattern = dir
      .replaceAll('**/', '')
      .replaceAll('/**', '')
      .replaceAll('*', '');
    return importSource.includes(simplePattern);
  });
}
