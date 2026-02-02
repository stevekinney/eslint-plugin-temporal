import { RuleTester } from '@typescript-eslint/rule-tester';
import * as vitest from 'bun:test';

// Configure RuleTester to use Bun's test framework
RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

/**
 * Create a rule tester configured for TypeScript and Bun
 */
export function createRuleTester(
  options?: Partial<ConstructorParameters<typeof RuleTester>[0]>,
): RuleTester {
  return new RuleTester({
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.ts'],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
    ...options,
  });
}

/**
 * Create a basic rule tester without type information
 * (faster, but can't use type-aware rules)
 */
export function createBasicRuleTester(
  options?: Partial<ConstructorParameters<typeof RuleTester>[0]>,
): RuleTester {
  return new RuleTester({
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    ...options,
  });
}

/**
 * Helper to create a workflow file path for testing
 */
export function workflowFile(filename: string = 'workflow.ts'): string {
  return `/project/src/workflows/${filename}`;
}

/**
 * Helper to create an activity file path for testing
 */
export function activityFile(filename: string = 'activities.ts'): string {
  return `/project/src/activities/${filename}`;
}

/**
 * Helper to create a worker file path for testing
 */
export function workerFile(filename: string = 'worker.ts'): string {
  return `/project/src/worker/${filename}`;
}

/**
 * Helper to create a client file path for testing
 */
export function clientFile(filename: string = 'client.ts'): string {
  return `/project/src/client/${filename}`;
}

export function createWorkflowRuleTester(): RuleTester {
  return createBasicRuleTester({
    defaultFilenames: { ts: workflowFile(), tsx: workflowFile('workflow.tsx') },
  });
}

export function createActivityRuleTester(): RuleTester {
  return createBasicRuleTester({
    defaultFilenames: { ts: activityFile(), tsx: activityFile('activity.tsx') },
  });
}

export function createWorkerRuleTester(): RuleTester {
  return createBasicRuleTester({
    defaultFilenames: { ts: workerFile(), tsx: workerFile('worker.tsx') },
  });
}

export function createClientRuleTester(): RuleTester {
  return createBasicRuleTester({
    defaultFilenames: { ts: clientFile(), tsx: clientFile('client.tsx') },
  });
}
