import { describe, expect, it } from 'bun:test';

import { lintRecommended } from '../test-utilities/recommended-eslint.ts';

const cwd = process.cwd();

function sortedRuleIds(messages: Array<{ ruleId: string | null }>): string[] {
  return messages
    .map((message) => message.ruleId)
    .filter((ruleId): ruleId is string => Boolean(ruleId))
    .sort();
}

async function lintRuleIds(
  code: string,
  filePath: string,
  settings?: Record<string, unknown>,
): Promise<string[]> {
  const result = await lintRecommended(code, filePath, settings);
  if (!result) {
    throw new Error('No lint results returned.');
  }
  return sortedRuleIds(result.messages);
}

describe('recommended config integration', () => {
  it('applies workflow rules based on imports', async () => {
    const code = `
      import { log } from '@temporalio/workflow';
      console.log('hello');
    `;
    const filePath = `${cwd}/src/workflows/imported.ts`;
    const ruleIds = await lintRuleIds(code, filePath);

    expect(ruleIds).toEqual(['temporal/workflow-no-console']);
  });

  it('falls back to file path detection when imports are absent', async () => {
    const code = `console.log('hello');`;
    const filePath = `${cwd}/src/workflows/fallback.ts`;
    const ruleIds = await lintRuleIds(code, filePath);

    expect(ruleIds).toEqual(['temporal/workflow-no-console']);
  });

  it('handles conflicting import and file path signals', async () => {
    const code = `
      import { Client } from '@temporalio/client';
      const client = new Client();
      const taskQueue = 'main';
      client.workflow.start(myWorkflow, { taskQueue });
      console.log('hello');
    `;
    const filePath = `${cwd}/src/workflows/import-wins.ts`;
    const ruleIds = await lintRuleIds(code, filePath);

    expect(ruleIds).toEqual([
      'temporal/client-require-workflow-id',
      'temporal/workflow-no-client-import',
      'temporal/workflow-no-console',
    ]);
  });

  it('applies workflow rules to test contexts by default', async () => {
    const code = `
      import { TestWorkflowEnvironment } from '@temporalio/testing';
      console.log('hello');
    `;
    const filePath = `${cwd}/src/__tests__/workflow.test.ts`;
    const ruleIds = await lintRuleIds(code, filePath);

    expect(ruleIds).toEqual(['temporal/workflow-no-console']);
  });

  it('respects custom file pattern settings', async () => {
    const code = `console.log('hello');`;
    const filePath = `${cwd}/src/wf/custom.ts`;
    const ruleIds = await lintRuleIds(code, filePath, {
      temporal: {
        filePatterns: {
          workflow: ['**/wf/**'],
        },
      },
    });

    expect(ruleIds).toEqual(['temporal/workflow-no-console']);
  });

  it('does not apply context-specific rules in unknown files', async () => {
    const code = `console.log('hello');`;
    const filePath = `${cwd}/src/utils/helpers.ts`;
    const ruleIds = await lintRuleIds(code, filePath);

    expect(ruleIds).toEqual([]);
  });
});
