import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'bun:test';

import { createRecommendedEslint } from '../test-utilities/recommended-eslint.ts';

const fixturePath = new URL(
  '../__fixtures__/workflows/large-workflow.ts',
  import.meta.url,
);
const fixtureCode = readFileSync(fixturePath, 'utf8');
const workflowFilePath = `${process.cwd()}/src/workflows/fixtures/large-workflow.ts`;

describe('performance guardrails', () => {
  it('lints a large workflow fixture quickly and deterministically', async () => {
    const eslint = createRecommendedEslint();
    const start = performance.now();
    const [result] = await eslint.lintText(fixtureCode, { filePath: workflowFilePath });
    const durationMs = performance.now() - start;

    if (!result) {
      throw new Error('No lint results returned.');
    }

    expect(result.messages).toHaveLength(0);
    expect(durationMs).toBeLessThan(2000);
  });
});
