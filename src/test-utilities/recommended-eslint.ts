import parser from '@typescript-eslint/parser';
import type { Linter } from 'eslint';
import { ESLint } from 'eslint';

import plugin from '../index.ts';

const baseConfig = {
  files: ['**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};

export function createRecommendedEslint(settings?: Record<string, unknown>): ESLint {
  const config = (settings ? { ...baseConfig, settings } : baseConfig) as Linter.Config;
  const recommendedConfig = plugin.configs['recommended'] as Linter.Config | undefined;

  if (!recommendedConfig) {
    throw new Error('Recommended config not found on plugin.');
  }

  return new ESLint({
    overrideConfigFile: true,
    ignore: false,
    overrideConfig: [config, recommendedConfig],
  });
}

export async function lintRecommended(
  code: string,
  filePath: string,
  settings?: Record<string, unknown>,
): Promise<ESLint.LintResult> {
  const eslint = createRecommendedEslint(settings);
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) {
    throw new Error('No lint results returned.');
  }
  return result;
}
