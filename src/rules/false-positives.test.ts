import type { TSESLint } from '@typescript-eslint/utils';
import { describe } from 'bun:test';

import {
  createActivityRuleTester,
  createBasicRuleTester,
  createClientRuleTester,
  createTestRuleTester,
  createWorkerRuleTester,
  createWorkflowRuleTester,
} from '../test-utilities/rule-tester.ts';
import { rules } from './index.ts';

const workflowTester = createWorkflowRuleTester();
const activityTester = createActivityRuleTester();
const workerTester = createWorkerRuleTester();
const clientTester = createClientRuleTester();
const testTester = createTestRuleTester();
const sharedTester = createBasicRuleTester();

const falsePositiveCode = `
  const value = 42;
  function add(input) {
    return input + value;
  }
  export { add };
`;

type RuleContext = 'workflow' | 'activity' | 'worker' | 'client' | 'test' | 'shared';

function getContext(ruleKey: string): RuleContext {
  if (ruleKey.startsWith('workflow-')) return 'workflow';
  if (ruleKey.startsWith('activity-')) return 'activity';
  if (ruleKey.startsWith('worker-')) return 'worker';
  if (ruleKey.startsWith('client-')) return 'client';
  if (ruleKey.startsWith('test-') || ruleKey.startsWith('replay-')) return 'test';
  return 'shared';
}

const testers = {
  workflow: workflowTester,
  activity: activityTester,
  worker: workerTester,
  client: clientTester,
  test: testTester,
  shared: sharedTester,
} as const;

describe('rule false positives', () => {
  for (const [ruleKey, rule] of Object.entries(rules)) {
    const context = getContext(ruleKey);
    const tester = testers[context];

    tester.run(
      `${ruleKey} - false positives`,
      rule as TSESLint.RuleModule<string, readonly unknown[]>,
      {
        valid: [falsePositiveCode],
        invalid: [],
      },
    );
  }
});
