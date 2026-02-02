import { describe, expect, it } from 'bun:test';

import { createImportTrackerVisitor, ImportTracker } from './import-tracker.ts';

// Helper to create a mock import declaration
function createMockImportDeclaration(
  source: string,
  specifiers: Array<{
    imported: string;
    local: string;
    isTypeSpecifier?: boolean;
  }> = [],
  isTypeOnly = false,
) {
  return {
    type: 'ImportDeclaration',
    source: { value: source },
    importKind: isTypeOnly ? 'type' : 'value',
    specifiers: specifiers.map((spec) => ({
      type: 'ImportSpecifier',
      imported: { type: 'Identifier', name: spec.imported },
      local: { type: 'Identifier', name: spec.local },
      importKind: spec.isTypeSpecifier ? 'type' : 'value',
    })),
  } as any;
}

// Helper to create a mock namespace import: import * as name from 'source'
function createMockNamespaceImport(
  source: string,
  localName: string,
  isTypeOnly = false,
) {
  return {
    type: 'ImportDeclaration',
    source: { value: source },
    importKind: isTypeOnly ? 'type' : 'value',
    specifiers: [
      {
        type: 'ImportNamespaceSpecifier',
        local: { type: 'Identifier', name: localName },
      },
    ],
  } as any;
}

// Helper to create a mock default import: import name from 'source'
function createMockDefaultImport(source: string, localName: string, isTypeOnly = false) {
  return {
    type: 'ImportDeclaration',
    source: { value: source },
    importKind: isTypeOnly ? 'type' : 'value',
    specifiers: [
      {
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: localName },
      },
    ],
  } as any;
}

describe('ImportTracker', () => {
  describe('addImport', () => {
    it('tracks named imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
          { imported: 'sleep', local: 'sleep' },
        ]),
      );

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
      expect(tracker.getLocalName('@temporalio/workflow', 'proxyActivities')).toBe(
        'proxyActivities',
      );
      expect(tracker.getLocalName('@temporalio/workflow', 'sleep')).toBe('sleep');
    });

    it('tracks renamed imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'createActivities' },
        ]),
      );

      expect(tracker.getLocalName('@temporalio/workflow', 'proxyActivities')).toBe(
        'createActivities',
      );
    });

    it('tracks namespace imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(createMockNamespaceImport('@temporalio/workflow', 'wf'));

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
      expect(tracker.getLocalName('@temporalio/workflow', '*')).toBe('wf');
    });

    it('tracks default imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(createMockDefaultImport('lodash', '_'));

      expect(tracker.hasImportFrom('lodash')).toBe(true);
      expect(tracker.getLocalName('lodash', 'default')).toBe('_');
    });

    it('tracks type-only imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration(
          '@temporalio/workflow',
          [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
          true,
        ),
      );

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
      expect(tracker.hasValueImportFrom('@temporalio/workflow')).toBe(false);
    });

    it('merges imports from the same source', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'sleep', local: 'sleep' },
        ]),
      );

      expect(tracker.getLocalName('@temporalio/workflow', 'proxyActivities')).toBe(
        'proxyActivities',
      );
      expect(tracker.getLocalName('@temporalio/workflow', 'sleep')).toBe('sleep');
    });

    it('marks import as non-type-only if any import is value import', () => {
      const tracker = new ImportTracker();
      // First add type-only import
      tracker.addImport(
        createMockImportDeclaration(
          '@temporalio/workflow',
          [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
          true,
        ),
      );
      // Then add value import
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.hasValueImportFrom('@temporalio/workflow')).toBe(true);
    });

    it('handles literal imported names', () => {
      const tracker = new ImportTracker();
      // Create import with literal imported name (e.g., import { "string-name" as alias })
      const importNode = {
        type: 'ImportDeclaration',
        source: { value: 'some-module' },
        importKind: 'value',
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: { type: 'Literal', value: 'string-name' },
            local: { type: 'Identifier', name: 'alias' },
            importKind: 'value',
          },
        ],
      } as any;

      tracker.addImport(importNode);
      expect(tracker.getLocalName('some-module', 'string-name')).toBe('alias');
    });
  });

  describe('getLocalName', () => {
    it('returns local name for named import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.getLocalName('@temporalio/workflow', 'proxyActivities')).toBe(
        'proxyActivities',
      );
    });

    it('returns local name for renamed import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'createProxies' },
        ]),
      );

      expect(tracker.getLocalName('@temporalio/workflow', 'proxyActivities')).toBe(
        'createProxies',
      );
    });

    it('returns undefined for missing import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.getLocalName('@temporalio/workflow', 'sleep')).toBeUndefined();
      expect(tracker.getLocalName('@temporalio/activity', 'Context')).toBeUndefined();
    });

    it('returns undefined for non-existent source', () => {
      const tracker = new ImportTracker();
      expect(tracker.getLocalName('non-existent', 'something')).toBeUndefined();
    });
  });

  describe('isTypeOnlyImport', () => {
    it('returns true for import type', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration(
          '@temporalio/workflow',
          [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
          true,
        ),
      );

      expect(tracker.isTypeOnlyImport('@temporalio/workflow', 'WorkflowInfo')).toBe(true);
    });

    it('returns true for type specifier in value import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'WorkflowInfo', local: 'WorkflowInfo', isTypeSpecifier: true },
        ]),
      );

      expect(tracker.isTypeOnlyImport('@temporalio/workflow', 'WorkflowInfo')).toBe(true);
    });

    it('returns false for value import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.isTypeOnlyImport('@temporalio/workflow', 'proxyActivities')).toBe(
        false,
      );
    });

    it('returns false for non-existent source', () => {
      const tracker = new ImportTracker();
      expect(tracker.isTypeOnlyImport('non-existent', 'something')).toBe(false);
    });

    it('falls back to import-level type-only for missing specifier', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration(
          '@temporalio/workflow',
          [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
          true,
        ),
      );

      // Query a specifier that doesn't exist
      expect(tracker.isTypeOnlyImport('@temporalio/workflow', 'NonExistent')).toBe(true);
    });
  });

  describe('getValueSpecifiers', () => {
    it('filters out type-only specifiers', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
          { imported: 'WorkflowInfo', local: 'WorkflowInfo', isTypeSpecifier: true },
        ]),
      );

      const valueSpecifiers = tracker.getValueSpecifiers('@temporalio/workflow');
      expect(valueSpecifiers).toHaveLength(1);
      expect(valueSpecifiers[0]?.imported).toBe('proxyActivities');
    });

    it('returns all for value imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
          { imported: 'sleep', local: 'sleep' },
        ]),
      );

      const valueSpecifiers = tracker.getValueSpecifiers('@temporalio/workflow');
      expect(valueSpecifiers).toHaveLength(2);
    });

    it('handles mixed imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
          { imported: 'sleep', local: 'sleep' },
          { imported: 'WorkflowInfo', local: 'WorkflowInfo', isTypeSpecifier: true },
          { imported: 'Context', local: 'Context', isTypeSpecifier: true },
        ]),
      );

      const valueSpecifiers = tracker.getValueSpecifiers('@temporalio/workflow');
      expect(valueSpecifiers).toHaveLength(2);
      expect(valueSpecifiers.map((s) => s.imported)).toEqual([
        'proxyActivities',
        'sleep',
      ]);
    });

    it('returns empty array for type-only imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration(
          '@temporalio/workflow',
          [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
          true,
        ),
      );

      expect(tracker.getValueSpecifiers('@temporalio/workflow')).toEqual([]);
    });

    it('returns empty array for non-existent source', () => {
      const tracker = new ImportTracker();
      expect(tracker.getValueSpecifiers('non-existent')).toEqual([]);
    });
  });

  describe('namespace imports', () => {
    it('tracks import * as workflow', () => {
      const tracker = new ImportTracker();
      tracker.addImport(createMockNamespaceImport('@temporalio/workflow', 'workflow'));

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
      expect(tracker.getLocalName('@temporalio/workflow', '*')).toBe('workflow');
    });

    it('tracks type-only namespace import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(createMockNamespaceImport('@temporalio/workflow', 'wf', true));

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
      expect(tracker.hasValueImportFrom('@temporalio/workflow')).toBe(false);
      expect(tracker.isTypeOnlyImport('@temporalio/workflow', '*')).toBe(true);
    });

    it('detects context from namespace import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(createMockNamespaceImport('@temporalio/workflow', 'wf'));

      expect(tracker.detectTemporalFileType()).toBe('workflow');
    });
  });

  describe('getAllImports', () => {
    it('returns all tracked imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );
      tracker.addImport(
        createMockImportDeclaration('@temporalio/activity', [
          { imported: 'Context', local: 'Context' },
        ]),
      );

      const imports = tracker.getAllImports();
      expect(imports).toHaveLength(2);
      expect(imports.map((i) => i.source)).toEqual([
        '@temporalio/workflow',
        '@temporalio/activity',
      ]);
    });

    it('returns empty array when no imports', () => {
      const tracker = new ImportTracker();
      expect(tracker.getAllImports()).toEqual([]);
    });
  });

  describe('getImportNode', () => {
    it('returns the import node for a source', () => {
      const tracker = new ImportTracker();
      const importNode = createMockImportDeclaration('@temporalio/workflow', [
        { imported: 'proxyActivities', local: 'proxyActivities' },
      ]);
      tracker.addImport(importNode);

      expect(tracker.getImportNode('@temporalio/workflow')).toBe(importNode);
    });

    it('returns undefined for non-existent source', () => {
      const tracker = new ImportTracker();
      expect(tracker.getImportNode('non-existent')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('removes all tracked imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);

      tracker.clear();

      expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(false);
      expect(tracker.getAllImports()).toEqual([]);
    });
  });

  describe('detectTemporalFileType', () => {
    it('detects test from @temporalio/testing', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/testing', [
          { imported: 'TestWorkflowEnvironment', local: 'TestWorkflowEnvironment' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('test');
    });

    it('detects workflow from @temporalio/workflow', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('workflow');
    });

    it('detects activity from @temporalio/activity', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/activity', [
          { imported: 'Context', local: 'Context' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('activity');
    });

    it('detects worker from @temporalio/worker with Worker import', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/worker', [
          { imported: 'Worker', local: 'Worker' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('worker');
    });

    it('detects client from @temporalio/client', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/client', [
          { imported: 'Client', local: 'Client' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('client');
    });

    it('detects shared from @temporalio/common only', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/common', [
          { imported: 'ApplicationFailure', local: 'ApplicationFailure' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('shared');
    });

    it('returns unknown when no Temporal imports', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('lodash', [{ imported: 'map', local: 'map' }]),
      );

      expect(tracker.detectTemporalFileType()).toBe('unknown');
    });

    it('prioritizes test over other contexts', () => {
      const tracker = new ImportTracker();
      tracker.addImport(
        createMockImportDeclaration('@temporalio/testing', [
          { imported: 'TestWorkflowEnvironment', local: 'TestWorkflowEnvironment' },
        ]),
      );
      tracker.addImport(
        createMockImportDeclaration('@temporalio/workflow', [
          { imported: 'proxyActivities', local: 'proxyActivities' },
        ]),
      );

      expect(tracker.detectTemporalFileType()).toBe('test');
    });
  });
});

describe('createImportTrackerVisitor', () => {
  it('creates a visitor that tracks imports', () => {
    const tracker = new ImportTracker();
    const visitor = createImportTrackerVisitor(tracker);

    expect(visitor.ImportDeclaration).toBeDefined();

    // Simulate the visitor being called
    const importNode = createMockImportDeclaration('@temporalio/workflow', [
      { imported: 'proxyActivities', local: 'proxyActivities' },
    ]);

    (visitor.ImportDeclaration as (node: any) => void)(importNode);

    expect(tracker.hasImportFrom('@temporalio/workflow')).toBe(true);
  });
});
