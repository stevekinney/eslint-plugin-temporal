import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import type { ImportSpecifier, TemporalFileType, TrackedImport } from '../types.ts';
import { TEMPORAL_PACKAGES } from './temporal-packages.ts';

/**
 * Tracks imports in a file and provides utilities for querying them.
 *
 * Usage:
 * ```typescript
 * const tracker = new ImportTracker();
 *
 * // In Program:enter or ImportDeclaration visitor
 * tracker.addImport(node);
 *
 * // Query imports
 * if (tracker.hasImportFrom('@temporalio/workflow')) {
 *   const logName = tracker.getLocalName('@temporalio/workflow', 'log');
 * }
 * ```
 */
export class ImportTracker {
  private imports: Map<string, TrackedImport> = new Map();

  /**
   * Add an import declaration to track
   */
  addImport(node: TSESTree.ImportDeclaration): void {
    const source = node.source.value;
    const isTypeOnly = node.importKind === 'type';

    const specifiers: ImportSpecifier[] = [];

    for (const spec of node.specifiers) {
      // eslint-disable-next-line unicorn/prefer-switch -- switch doesn't work with AST_NODE_TYPES enum
      if (spec.type === AST_NODE_TYPES.ImportSpecifier) {
        specifiers.push({
          imported:
            spec.imported.type === AST_NODE_TYPES.Identifier
              ? spec.imported.name
              : spec.imported.value,
          local: spec.local.name,
          isTypeOnly: isTypeOnly || spec.importKind === 'type',
        });
      } else if (spec.type === AST_NODE_TYPES.ImportDefaultSpecifier) {
        specifiers.push({
          imported: 'default',
          local: spec.local.name,
          isTypeOnly,
        });
      } else if (spec.type === AST_NODE_TYPES.ImportNamespaceSpecifier) {
        specifiers.push({
          imported: '*',
          local: spec.local.name,
          isTypeOnly,
        });
      }
    }

    // Merge with existing imports from the same source
    const existing = this.imports.get(source);
    if (existing) {
      existing.specifiers.push(...specifiers);
      // If any import is not type-only, mark the whole thing as not type-only
      if (!isTypeOnly) {
        existing.isTypeOnly = false;
      }
    } else {
      this.imports.set(source, {
        source,
        specifiers,
        isTypeOnly,
        node,
      });
    }
  }

  /**
   * Check if there's any import from a given source
   */
  hasImportFrom(source: string): boolean {
    return this.imports.has(source);
  }

  /**
   * Check if there's a value (non-type) import from a given source
   */
  hasValueImportFrom(source: string): boolean {
    const tracked = this.imports.get(source);
    if (!tracked) return false;
    return !tracked.isTypeOnly;
  }

  /**
   * Get the local name for an imported identifier
   * Returns undefined if not imported
   */
  getLocalName(source: string, importedName: string): string | undefined {
    const tracked = this.imports.get(source);
    if (!tracked) return undefined;

    const specifier = tracked.specifiers.find((s) => s.imported === importedName);
    return specifier?.local;
  }

  /**
   * Get all tracked imports
   */
  getAllImports(): TrackedImport[] {
    return [...this.imports.values()];
  }

  /**
   * Get the import node for a source
   */
  getImportNode(source: string): TSESTree.ImportDeclaration | undefined {
    return this.imports.get(source)?.node;
  }

  /**
   * Check if a specific specifier is imported as type-only
   */
  isTypeOnlyImport(source: string, importedName: string): boolean {
    const tracked = this.imports.get(source);
    if (!tracked) return false;

    const specifier = tracked.specifiers.find((s) => s.imported === importedName);
    return specifier?.isTypeOnly ?? tracked.isTypeOnly;
  }

  /**
   * Get value (non-type) specifiers from a source
   */
  getValueSpecifiers(source: string): ImportSpecifier[] {
    const tracked = this.imports.get(source);
    if (!tracked) return [];

    if (tracked.isTypeOnly) return [];

    return tracked.specifiers.filter((s) => !s.isTypeOnly);
  }

  /**
   * Detect the Temporal file type based on imports
   */
  detectTemporalFileType(): TemporalFileType {
    // If importing from @temporalio/workflow, it's likely a workflow
    if (this.hasValueImportFrom(TEMPORAL_PACKAGES.workflow)) {
      return 'workflow';
    }

    // If importing from @temporalio/activity, it's likely an activity
    if (this.hasValueImportFrom(TEMPORAL_PACKAGES.activity)) {
      return 'activity';
    }

    // If importing Worker from @temporalio/worker, it's likely a worker
    if (this.hasValueImportFrom(TEMPORAL_PACKAGES.worker)) {
      const workerName = this.getLocalName(TEMPORAL_PACKAGES.worker, 'Worker');
      if (workerName) {
        return 'worker';
      }
    }

    // If importing Client from @temporalio/client, it's likely a client
    if (this.hasValueImportFrom(TEMPORAL_PACKAGES.client)) {
      return 'client';
    }

    return 'unknown';
  }

  /**
   * Clear all tracked imports
   */
  clear(): void {
    this.imports.clear();
  }
}

/**
 * Create an import tracker that automatically tracks imports
 * from ImportDeclaration nodes
 */
export function createImportTrackerVisitor(
  tracker: ImportTracker,
): TSESLint.RuleListener {
  return {
    ImportDeclaration(node) {
      tracker.addImport(node);
    },
  };
}
