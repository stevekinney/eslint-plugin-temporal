import { describe, expect, it } from 'bun:test';

import { ImportTracker } from './import-tracker.ts';
import {
  detectContext,
  detectContextFromImports,
  isContextMatch,
} from './temporal-context.ts';

// Helper to create a mock import declaration
function createMockImportDeclaration(
  source: string,
  specifiers: Array<{ imported: string; local: string }> = [],
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
      importKind: 'value',
    })),
  } as any;
}

describe('detectContextFromImports', () => {
  it('returns "test" when @temporalio/testing is imported', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/testing', [
        { imported: 'TestWorkflowEnvironment', local: 'TestWorkflowEnvironment' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('test');
  });

  it('returns "workflow" when @temporalio/workflow is imported with value imports', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/workflow', [
        { imported: 'proxyActivities', local: 'proxyActivities' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('workflow');
  });

  it('returns "unknown" when @temporalio/workflow is imported as type-only', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration(
        '@temporalio/workflow',
        [{ imported: 'WorkflowInfo', local: 'WorkflowInfo' }],
        true,
      ),
    );

    expect(detectContextFromImports(tracker)).toBe('unknown');
  });

  it('returns "activity" when @temporalio/activity is imported', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/activity', [
        { imported: 'Context', local: 'Context' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('activity');
  });

  it('returns "worker" when Worker is imported from @temporalio/worker', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/worker', [
        { imported: 'Worker', local: 'Worker' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('worker');
  });

  it('returns "client" when @temporalio/client is imported', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/client', [
        { imported: 'Client', local: 'Client' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('client');
  });

  it('returns "shared" when only @temporalio/common is imported', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/common', [
        { imported: 'ApplicationFailure', local: 'ApplicationFailure' },
      ]),
    );

    expect(detectContextFromImports(tracker)).toBe('shared');
  });

  it('returns "unknown" when no Temporal imports are present', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('lodash', [{ imported: 'map', local: 'map' }]),
    );

    expect(detectContextFromImports(tracker)).toBe('unknown');
  });

  it('prioritizes test context over workflow context', () => {
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

    expect(detectContextFromImports(tracker)).toBe('test');
  });

  it('prioritizes workflow context over activity context', () => {
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

    expect(detectContextFromImports(tracker)).toBe('workflow');
  });
});

describe('detectContext', () => {
  it('uses import detection when imports are present', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/workflow', [
        { imported: 'proxyActivities', local: 'proxyActivities' },
      ]),
    );

    const result = detectContext(tracker, '/some/random/path.ts');

    expect(result.context).toBe('workflow');
    expect(result.source).toBe('import');
  });

  it('falls back to file path detection when no imports are present', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/src/workflows/my-workflow.ts');

    expect(result.context).toBe('workflow');
    expect(result.source).toBe('file-path');
  });

  it('detects activity context from file path', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/src/activities/send-email.ts');

    expect(result.context).toBe('activity');
    expect(result.source).toBe('file-path');
  });

  it('detects worker context from file path', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/src/worker/main.ts');

    expect(result.context).toBe('worker');
    expect(result.source).toBe('file-path');
  });

  it('detects test context from file path', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/src/workflows/workflow.test.ts');

    expect(result.context).toBe('test');
    expect(result.source).toBe('file-path');
  });

  it('returns unknown when neither import nor file path detection works', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/src/utils/helpers.ts');

    expect(result.context).toBe('unknown');
    expect(result.source).toBe('unknown');
  });

  it('prioritizes imports over file path', () => {
    const tracker = new ImportTracker();
    tracker.addImport(
      createMockImportDeclaration('@temporalio/activity', [
        { imported: 'Context', local: 'Context' },
      ]),
    );

    // File path says workflow, but imports say activity
    const result = detectContext(tracker, '/project/src/workflows/mixed.ts');

    expect(result.context).toBe('activity');
    expect(result.source).toBe('import');
  });

  it('uses custom file patterns when provided', () => {
    const tracker = new ImportTracker();

    const result = detectContext(tracker, '/project/my-custom-workflows/flow.ts', {
      filePatterns: {
        workflow: ['**/my-custom-workflows/**'],
      },
    });

    expect(result.context).toBe('workflow');
    expect(result.source).toBe('file-path');
  });
});

describe('isContextMatch', () => {
  it('returns true for exact match', () => {
    expect(isContextMatch('workflow', 'workflow')).toBe(true);
    expect(isContextMatch('activity', 'activity')).toBe(true);
    expect(isContextMatch('test', 'test')).toBe(true);
  });

  it('returns false for non-match', () => {
    expect(isContextMatch('workflow', 'activity')).toBe(false);
    expect(isContextMatch('activity', 'workflow')).toBe(false);
  });

  it('treats test as workflow when option is enabled', () => {
    expect(isContextMatch('test', 'workflow', { treatTestAsWorkflow: true })).toBe(true);
  });

  it('does not treat test as workflow by default', () => {
    expect(isContextMatch('test', 'workflow')).toBe(false);
  });

  it('does not treat workflow as test', () => {
    expect(isContextMatch('workflow', 'test', { treatTestAsWorkflow: true })).toBe(false);
  });
});
