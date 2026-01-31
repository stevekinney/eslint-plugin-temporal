import type { TSESLint } from '@typescript-eslint/utils';

import type { FilePatterns, TemporalFileType, TemporalPluginSettings } from '../types.ts';
import { DEFAULT_FILE_PATTERNS } from '../types.ts';
import { detectTemporalFileType } from './file-detection.ts';
import { ImportTracker } from './import-tracker.ts';
import { TEMPORAL_PACKAGES } from './temporal-packages.ts';

/**
 * Temporal context detection result with additional metadata
 */
export interface TemporalContextResult {
  context: TemporalFileType;
  source: 'import' | 'file-path' | 'unknown';
}

/**
 * Detect the Temporal context from imports.
 *
 * Priority order:
 * 1. @temporalio/testing → 'test'
 * 2. @temporalio/workflow (value import) → 'workflow'
 * 3. @temporalio/activity (value import) → 'activity'
 * 4. Worker from @temporalio/worker → 'worker'
 * 5. @temporalio/client → 'client'
 * 6. Only @temporalio/common → 'shared'
 * 7. Otherwise → 'unknown'
 */
export function detectContextFromImports(tracker: ImportTracker): TemporalFileType {
  // Check for testing imports first
  if (tracker.hasValueImportFrom(TEMPORAL_PACKAGES.testing)) {
    return 'test';
  }

  // Check for workflow imports (value imports)
  if (tracker.hasValueImportFrom(TEMPORAL_PACKAGES.workflow)) {
    return 'workflow';
  }

  // Check for activity imports (value imports)
  if (tracker.hasValueImportFrom(TEMPORAL_PACKAGES.activity)) {
    return 'activity';
  }

  // Check for Worker import from worker package
  if (tracker.hasValueImportFrom(TEMPORAL_PACKAGES.worker)) {
    const workerName = tracker.getLocalName(TEMPORAL_PACKAGES.worker, 'Worker');
    if (workerName) {
      return 'worker';
    }
  }

  // Check for client imports
  if (tracker.hasValueImportFrom(TEMPORAL_PACKAGES.client)) {
    return 'client';
  }

  // Check if only importing from common (shared utilities)
  if (tracker.hasImportFrom(TEMPORAL_PACKAGES.common)) {
    // Verify no other Temporal packages are imported
    const hasOtherTemporalImports =
      tracker.hasImportFrom(TEMPORAL_PACKAGES.workflow) ||
      tracker.hasImportFrom(TEMPORAL_PACKAGES.activity) ||
      tracker.hasImportFrom(TEMPORAL_PACKAGES.worker) ||
      tracker.hasImportFrom(TEMPORAL_PACKAGES.client);

    if (!hasOtherTemporalImports) {
      return 'shared';
    }
  }

  return 'unknown';
}

/**
 * Detect the Temporal context combining import-based and file-path detection.
 *
 * Strategy:
 * 1. First try import-based detection (most reliable)
 * 2. Fall back to file-path detection
 * 3. Return 'unknown' if neither method can determine context
 */
export function detectContext(
  tracker: ImportTracker,
  filePath: string,
  settings?: TemporalPluginSettings,
): TemporalContextResult {
  // Try import-based detection first
  const importContext = detectContextFromImports(tracker);

  if (importContext !== 'unknown') {
    return {
      context: importContext,
      source: 'import',
    };
  }

  // Fall back to file-path detection
  const customPatterns = settings?.filePatterns;
  const fileContext = detectTemporalFileType(filePath, customPatterns);

  if (fileContext !== 'unknown') {
    return {
      context: fileContext,
      source: 'file-path',
    };
  }

  return {
    context: 'unknown',
    source: 'unknown',
  };
}

/**
 * Check if the current context matches the expected context.
 * Test contexts are treated specially - they can run workflow rules
 * but with some relaxations.
 */
export function isContextMatch(
  detected: TemporalFileType,
  expected: TemporalFileType,
  options?: { treatTestAsWorkflow?: boolean },
): boolean {
  if (detected === expected) {
    return true;
  }

  // Test files can be treated as workflows for running workflow rules
  // (useful for testing workflow code)
  if (options?.treatTestAsWorkflow && detected === 'test' && expected === 'workflow') {
    return true;
  }

  return false;
}

/**
 * Helper to get Temporal context from ESLint rule context.
 *
 * This function creates an ImportTracker, populates it from the current file's
 * imports, and detects the context.
 *
 * Usage in a rule:
 * ```typescript
 * create(context) {
 *   const tracker = new ImportTracker();
 *   return {
 *     ImportDeclaration(node) {
 *       tracker.addImport(node);
 *     },
 *     'Program:exit'() {
 *       const temporalContext = getTemporalContextFromRule(context, tracker);
 *       if (temporalContext !== 'workflow') {
 *         return; // Skip non-workflow files
 *       }
 *       // ... rest of rule logic
 *     }
 *   };
 * }
 * ```
 */
export function getTemporalContextFromRule(
  ruleContext: TSESLint.RuleContext<string, unknown[]>,
  tracker: ImportTracker,
): TemporalFileType {
  const filename = ruleContext.filename;
  const settings = ruleContext.settings?.['temporal'] as
    | TemporalPluginSettings
    | undefined;

  const result = detectContext(tracker, filename, settings);
  return result.context;
}

/**
 * Check if a file path matches test patterns
 */
export function isTestFile(filePath: string, customPatterns?: FilePatterns): boolean {
  const patterns = customPatterns?.test ?? DEFAULT_FILE_PATTERNS.test;
  return detectTemporalFileType(filePath, { test: patterns }) === 'test';
}
