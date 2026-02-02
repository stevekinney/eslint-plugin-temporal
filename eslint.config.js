import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintComments from 'eslint-plugin-eslint-comments';
import eslintPlugin from 'eslint-plugin-eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-n';
import promise from 'eslint-plugin-promise';
import regexp from 'eslint-plugin-regexp';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const commonFiles = '**/*.{js,jsx,cjs,mjs,ts,tsx}';
const testFiles = [
  '**/*.{test,spec}.{js,jsx,ts,tsx}',
  '**/test/**/*.{js,jsx,ts,tsx}',
  '**/__tests__/**/*.{js,jsx,ts,tsx}',
];
const ruleFiles = 'src/rules/**/*.{ts,tsx}';
const ruleTestFiles = 'src/rules/**/*.test.{ts,tsx}';
const nodeFiles = [
  'src/**/*.{ts,tsx}',
  'scripts/**/*.{js,jsx,cjs,mjs,ts,tsx}',
  'eslint.config.js',
];

const eslintPluginRulesConfig = eslintPlugin.configs['rules-recommended'];
const eslintPluginTestsConfig = eslintPlugin.configs['tests-recommended'];
const nodePluginRecommended = nodePlugin.configs['flat/recommended-module'];
const nodeMissingImportOptions = {
  tryExtensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.d.ts'],
  tsconfigPath: './tsconfig.json',
  ignoreTypeImport: true,
};
const nodeUnpublishedImportOptions = {
  tryExtensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.d.ts'],
  ignoreTypeImport: true,
  ignorePrivate: true,
};
const nodeRules = {
  ...nodePluginRecommended.rules,
  'n/no-missing-import': ['error', nodeMissingImportOptions],
  'n/no-unpublished-import': ['error', nodeUnpublishedImportOptions],
};

const commonPlugins = {
  promise,
  unicorn,
  import: importPlugin,
  'eslint-comments': eslintComments,
  regexp,
  'unused-imports': unusedImports,
  'simple-import-sort': simpleImportSort,
};

const coreRules = {
  'no-restricted-syntax': ['error', 'WithStatement', 'LabeledStatement'],
  'no-console': 'off',
};

const promiseRules = {
  'promise/no-return-wrap': 'error',
  'promise/param-names': 'error',
  'promise/catch-or-return': 'error',
  'promise/no-nesting': 'warn',
  'promise/no-promise-in-callback': 'warn',
  'promise/no-callback-in-promise': 'warn',
  'promise/no-new-statics': 'error',
  'promise/no-return-in-finally': 'warn',
  'promise/valid-params': 'warn',
};

const unicornRules = {
  'unicorn/prevent-abbreviations': 'off',
  'unicorn/no-null': 'off',
  'unicorn/prefer-switch': 'warn',
  'unicorn/prefer-logical-operator-over-ternary': 'warn',
  'unicorn/no-await-expression-member': 'error',
};

const importRules = {
  'import/no-extraneous-dependencies': 'off',
  'import/order': 'off',
  'import/first': 'error',
  'import/no-duplicates': 'error',
  'import/no-cycle': 'error',
  'unused-imports/no-unused-imports': 'error',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
};

const eslintCommentsRules = {
  'eslint-comments/disable-enable-pair': 'error',
  'eslint-comments/no-unlimited-disable': 'error',
  'eslint-comments/no-unused-disable': 'error',
};

const regexpRules = {
  'regexp/no-empty-capturing-group': 'error',
  'regexp/no-lazy-ends': 'error',
};

export default [
  // Ignore patterns
  {
    ignores: [
      '**/{dist,build,coverage,.bun}/**',
      '**/__fixtures__/**',
      '**/node_modules/**',
      '**/*.lock',
      '**/README.md',
      '**/package.json',
    ],
  },

  // Base configuration
  js.configs.recommended,

  // Common JavaScript/TypeScript rules
  {
    files: [commonFiles],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          importAttributes: true,
        },
      },
      globals: {
        Bun: 'readonly',
        ...globals.node,
        ...globals.browser,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: commonPlugins,
    settings: {
      'import/resolver': {
        typescript: { project: ['./tsconfig.json'], alwaysTryTypes: true },
      },
    },
    rules: {
      ...coreRules,
      ...promiseRules,
      ...unicornRules,
      ...importRules,
      ...eslintCommentsRules,
      ...regexpRules,
      // Reduce noise and duplication with TS
      'import/no-cycle': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  // TypeScript: fast defaults (no type info)
  ...tseslint.configs.recommended,

  // TypeScript: type-aware linting only in src for performance
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...(config.languageOptions ?? {}),
      parserOptions: { projectService: true },
    },
    rules: {
      ...(config.rules ?? {}),
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  })),

  // ESLint rule authoring rules for plugin development
  {
    files: [ruleFiles],
    ...eslintPluginRulesConfig,
  },
  {
    files: [ruleTestFiles],
    ...eslintPluginTestsConfig,
  },

  // Node/bundler correctness for plugin source and tooling
  {
    files: nodeFiles,
    ignores: testFiles,
    plugins: nodePluginRecommended.plugins,
    languageOptions: nodePluginRecommended.languageOptions,
    settings: {
      node: {
        version: '>=18.0.0',
      },
    },
    rules: nodeRules,
  },
  {
    files: ['scripts/**/*.{js,jsx,cjs,mjs,ts,tsx}'],
    rules: {
      'n/hashbang': 'off',
      'n/no-process-exit': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['src/test-utilities/**/*.{ts,tsx}'],
    rules: {
      'n/no-missing-import': 'off',
    },
  },

  // Test file overrides - looser restrictions for testing
  {
    files: testFiles,
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        jest: 'readonly',
        mock: 'readonly',
      },
    },
    rules: {
      // Allow any for testing edge cases and unhappy paths
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Relax other strict rules for tests
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',

      // Allow magic numbers and other patterns common in tests
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',

      // Allow empty functions for mocks/stubs
      '@typescript-eslint/no-empty-function': 'off',

      // Allow unused expressions for expect() chains
      '@typescript-eslint/no-unused-expressions': 'off',

      // Allow unused vars/args in tests (common with mock callbacks, setup fixtures)
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },

  // Put Prettier last to switch off conflicting stylistic rules
  eslintConfigPrettier,
];
