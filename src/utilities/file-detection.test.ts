import { describe, expect, it } from 'bun:test';

import {
  detectTemporalFileType,
  isActivityPath,
  isRelativeActivityImport,
} from './file-detection.ts';

describe('isActivityPath', () => {
  it('detects /activities/ directory pattern', () => {
    expect(isActivityPath('/project/src/activities/send-email.ts')).toBe(true);
    expect(isActivityPath('src/activities/email.ts')).toBe(true);
  });

  it('detects nested activities directories', () => {
    expect(isActivityPath('/project/src/temporal/activities/notifications.ts')).toBe(
      true,
    );
  });

  it('returns false for workflow paths', () => {
    expect(isActivityPath('/project/src/workflows/my-workflow.ts')).toBe(false);
    expect(isActivityPath('src/workflows/process.ts')).toBe(false);
  });

  it('returns false for other paths', () => {
    expect(isActivityPath('/project/src/utils/helpers.ts')).toBe(false);
    expect(isActivityPath('/project/src/index.ts')).toBe(false);
  });

  it('handles custom activity directories', () => {
    const customDirs = ['**/tasks/**', '**/jobs/**'];
    expect(isActivityPath('/project/src/tasks/send-email.ts', customDirs)).toBe(true);
    expect(isActivityPath('/project/src/jobs/process.ts', customDirs)).toBe(true);
    expect(isActivityPath('/project/src/activities/email.ts', customDirs)).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isActivityPath('')).toBe(false);
    // 'activities' alone doesn't match **/activities/** because ** requires at least one /
    expect(isActivityPath('activities')).toBe(false);
  });
});

describe('isRelativeActivityImport', () => {
  it('detects ../activities/send-email pattern', () => {
    expect(
      isRelativeActivityImport(
        '../activities/send-email',
        '/project/src/workflows/wf.ts',
      ),
    ).toBe(true);
    expect(
      isRelativeActivityImport(
        '../activities/notifications',
        '/project/src/workflows/wf.ts',
      ),
    ).toBe(true);
  });

  it('detects ./activities pattern', () => {
    expect(isRelativeActivityImport('./activities', '/project/src/index.ts')).toBe(true);
    expect(isRelativeActivityImport('./activities/email', '/project/src/index.ts')).toBe(
      true,
    );
  });

  it('detects /activity/ singular pattern', () => {
    expect(
      isRelativeActivityImport('../activity/send-email', '/project/src/workflows/wf.ts'),
    ).toBe(true);
    expect(isRelativeActivityImport('./activity', '/project/src/index.ts')).toBe(true);
  });

  it('detects .activities suffix pattern', () => {
    expect(
      isRelativeActivityImport('./email.activities', '/project/src/workflows/wf.ts'),
    ).toBe(true);
    expect(
      isRelativeActivityImport('../shared.activities', '/project/src/workflows/wf.ts'),
    ).toBe(true);
  });

  it('detects .activity suffix pattern', () => {
    expect(
      isRelativeActivityImport('./send-email.activity', '/project/src/workflows/wf.ts'),
    ).toBe(true);
    expect(
      isRelativeActivityImport('../notify.activity', '/project/src/workflows/wf.ts'),
    ).toBe(true);
  });

  it('rejects absolute imports', () => {
    expect(
      isRelativeActivityImport('@/activities/send-email', '/project/src/workflows/wf.ts'),
    ).toBe(false);
    expect(
      isRelativeActivityImport('activities/email', '/project/src/workflows/wf.ts'),
    ).toBe(false);
    expect(
      isRelativeActivityImport(
        '@temporalio/activity',
        '/project/src/activities/email.ts',
      ),
    ).toBe(false);
  });

  it('rejects non-activity relative imports', () => {
    expect(
      isRelativeActivityImport('../utils/helpers', '/project/src/workflows/wf.ts'),
    ).toBe(false);
    expect(
      isRelativeActivityImport('./shared/types', '/project/src/workflows/wf.ts'),
    ).toBe(false);
    expect(isRelativeActivityImport('../constants', '/project/src/workflows/wf.ts')).toBe(
      false,
    );
  });

  it('handles custom activity directories', () => {
    const customDirs = ['**/tasks/**', '**/*.tasks.ts'];
    expect(
      isRelativeActivityImport(
        '../tasks/send-email',
        '/project/src/workflows/wf.ts',
        customDirs,
      ),
    ).toBe(true);
    expect(
      isRelativeActivityImport(
        './email.tasks',
        '/project/src/workflows/wf.ts',
        customDirs,
      ),
    ).toBe(true);
    // The function has hardcoded patterns that also match 'activities' regardless of custom dirs
    // So ../activities still matches even with custom dirs
    expect(
      isRelativeActivityImport(
        '../activities/send-email',
        '/project/src/workflows/wf.ts',
        customDirs,
      ),
    ).toBe(true);
  });

  it('handles edge cases', () => {
    expect(isRelativeActivityImport('.', '/project/src/workflows/wf.ts')).toBe(false);
    expect(isRelativeActivityImport('..', '/project/src/workflows/wf.ts')).toBe(false);
  });
});

describe('detectTemporalFileType', () => {
  describe('workflow detection', () => {
    it('detects workflow from /workflows/ directory', () => {
      expect(detectTemporalFileType('/project/src/workflows/my-workflow.ts')).toBe(
        'workflow',
      );
      expect(detectTemporalFileType('src/workflows/process.ts')).toBe('workflow');
    });

    it('detects workflow from .workflow.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/order.workflow.ts')).toBe('workflow');
    });

    it('detects workflow from .workflows.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/order.workflows.ts')).toBe('workflow');
    });
  });

  describe('activity detection', () => {
    it('detects activity from /activities/ directory', () => {
      expect(detectTemporalFileType('/project/src/activities/send-email.ts')).toBe(
        'activity',
      );
      expect(detectTemporalFileType('src/activities/notifications.ts')).toBe('activity');
    });

    it('detects activity from .activity.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/email.activity.ts')).toBe('activity');
    });

    it('detects activity from .activities.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/email.activities.ts')).toBe('activity');
    });
  });

  describe('worker detection', () => {
    it('detects worker from /worker/ directory', () => {
      expect(detectTemporalFileType('/project/src/worker/main.ts')).toBe('worker');
    });

    it('detects worker from /workers/ directory', () => {
      expect(detectTemporalFileType('/project/src/workers/main.ts')).toBe('worker');
    });

    it('detects worker from .worker.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/main.worker.ts')).toBe('worker');
    });
  });

  describe('client detection', () => {
    it('detects client from /client/ directory', () => {
      expect(detectTemporalFileType('/project/src/client/start.ts')).toBe('client');
    });

    it('detects client from /clients/ directory', () => {
      expect(detectTemporalFileType('/project/src/clients/start.ts')).toBe('client');
    });

    it('detects client from .client.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/start.client.ts')).toBe('client');
    });
  });

  describe('test detection', () => {
    it('detects test from .test.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/workflow.test.ts')).toBe('test');
      expect(detectTemporalFileType('/project/src/activities/email.test.ts')).toBe(
        'test',
      );
    });

    it('detects test from .spec.ts suffix', () => {
      expect(detectTemporalFileType('/project/src/workflow.spec.ts')).toBe('test');
    });

    it('detects test from /test/ directory', () => {
      expect(detectTemporalFileType('/project/test/workflow.ts')).toBe('test');
    });

    it('detects test from /__tests__/ directory', () => {
      expect(detectTemporalFileType('/project/src/__tests__/workflow.ts')).toBe('test');
    });

    it('prioritizes test detection over workflow/activity directories', () => {
      // Test files in workflow directories should be detected as tests
      expect(detectTemporalFileType('/project/src/workflows/my-workflow.test.ts')).toBe(
        'test',
      );
      expect(detectTemporalFileType('/project/src/activities/email.test.ts')).toBe(
        'test',
      );
    });
  });

  describe('unknown detection', () => {
    it('returns unknown for non-matching paths', () => {
      expect(detectTemporalFileType('/project/src/utils/helpers.ts')).toBe('unknown');
      expect(detectTemporalFileType('/project/src/index.ts')).toBe('unknown');
      expect(detectTemporalFileType('/project/src/config.ts')).toBe('unknown');
    });
  });

  describe('Windows path handling', () => {
    it('handles Windows-style path separators', () => {
      expect(detectTemporalFileType('C:\\project\\src\\workflows\\my-workflow.ts')).toBe(
        'workflow',
      );
      expect(detectTemporalFileType('C:\\project\\src\\activities\\email.ts')).toBe(
        'activity',
      );
      expect(detectTemporalFileType('C:\\project\\src\\workflow.test.ts')).toBe('test');
    });
  });

  describe('custom patterns', () => {
    it('uses custom workflow patterns', () => {
      const customPatterns = {
        workflow: ['**/flows/**'],
      };
      expect(
        detectTemporalFileType('/project/src/flows/my-flow.ts', customPatterns),
      ).toBe('workflow');
      // Custom patterns replace defaults for that category
      expect(
        detectTemporalFileType('/project/src/workflows/my-workflow.ts', customPatterns),
      ).toBe('unknown');
    });

    it('can extend workflow patterns by including defaults', () => {
      const customPatterns = {
        workflow: [
          '**/workflows/**',
          '**/*.workflow.ts',
          '**/*.workflows.ts',
          '**/flows/**',
        ],
      };
      expect(
        detectTemporalFileType('/project/src/flows/my-flow.ts', customPatterns),
      ).toBe('workflow');
      expect(
        detectTemporalFileType('/project/src/workflows/my-workflow.ts', customPatterns),
      ).toBe('workflow');
    });

    it('uses custom activity patterns', () => {
      const customPatterns = {
        activity: ['**/tasks/**'],
      };
      expect(
        detectTemporalFileType('/project/src/tasks/send-email.ts', customPatterns),
      ).toBe('activity');
    });

    it('uses custom test patterns', () => {
      const customPatterns = {
        test: ['**/*.unit.ts'],
      };
      expect(
        detectTemporalFileType('/project/src/workflow.unit.ts', customPatterns),
      ).toBe('test');
    });
  });
});
