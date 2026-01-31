import { describe, expect, it } from 'bun:test';

import plugin from './index.ts';

describe('eslint-plugin-temporal', () => {
  it('exports rules', () => {
    expect(plugin.rules).toBeDefined();
    expect(Object.keys(plugin.rules).length).toBeGreaterThan(0);
  });

  it('exports configs', () => {
    expect(plugin.configs).toBeDefined();
    expect(plugin.configs['recommended']).toBeDefined();
    expect(plugin.configs['workflow']).toBeDefined();
    expect(plugin.configs['activity']).toBeDefined();
    expect(plugin.configs['worker']).toBeDefined();
    expect(plugin.configs['client']).toBeDefined();
    expect(plugin.configs['strict']).toBeDefined();
  });

  it('has plugin metadata', () => {
    expect(plugin.meta.name).toBe('eslint-plugin-temporal');
    expect(plugin.meta.version).toBeDefined();
  });

  it('configs include plugin reference', () => {
    expect(plugin.configs['recommended']!.plugins).toHaveProperty('temporal');
    expect(plugin.configs['workflow']!.plugins).toHaveProperty('temporal');
  });

  it('exports expected workflow rules', () => {
    const workflowRules = [
      'workflow-no-activity-definitions-import',
      'workflow-no-node-or-dom-imports',
      'workflow-no-unsafe-package-imports',
      'workflow-require-activity-timeouts',
      'workflow-no-console',
      'workflow-prefer-workflow-uuid',
      'workflow-no-floating-promises',
      'workflow-no-throw-raw-error',
      'workflow-patch-id-literal',
    ] as const;

    for (const rule of workflowRules) {
      expect(plugin.rules[rule]).toBeDefined();
    }
  });

  it('exports expected activity rules', () => {
    const activityRules = [
      'activity-prefer-activity-log',
      'activity-prefer-applicationfailure',
      'activity-heartbeat-in-long-loops',
      'activity-use-cancellation-signal',
      'activity-context-not-stored',
    ] as const;

    for (const rule of activityRules) {
      expect(plugin.rules[rule]).toBeDefined();
    }
  });

  it('exports expected shared rules', () => {
    const sharedRules = ['task-queue-constant', 'no-temporal-internal-imports'] as const;

    for (const rule of sharedRules) {
      expect(plugin.rules[rule]).toBeDefined();
    }
  });
});
