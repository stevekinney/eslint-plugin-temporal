import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noTopLevelWorkflowSideEffects } from './no-top-level-workflow-side-effects.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-top-level-workflow-side-effects', () => {
  ruleTester.run('no-top-level-workflow-side-effects', noTopLevelWorkflowSideEffects, {
    valid: [
      `import { proxyActivities, defineSignal, defineQuery } from '@temporalio/workflow';
       const activities = proxyActivities();
       const mySignal = defineSignal('mySignal');
       const myQuery = defineQuery('myQuery');
       export async function myWorkflow() {
         await activities.doThing();
       }`,
      `import * as workflow from '@temporalio/workflow';
       const { doThing } = workflow.proxyActivities();
       export async function myWorkflow() {
         await workflow.sleep('1s');
         await doThing();
       }`,
    ],
    invalid: [
      {
        code: `import { sleep } from '@temporalio/workflow';
sleep('1s');`,
        errors: [{ messageId: 'topLevelSideEffect' }],
      },
      {
        code: `import { startChild } from '@temporalio/workflow';
const child = startChild(myWorkflow);`,
        errors: [{ messageId: 'topLevelSideEffect' }],
      },
      {
        code: `import { proxyActivities } from '@temporalio/workflow';
const activities = proxyActivities();
activities.sendEmail();`,
        errors: [{ messageId: 'topLevelSideEffect' }],
      },
      {
        code: `import * as workflow from '@temporalio/workflow';
workflow.condition(() => ready);`,
        errors: [{ messageId: 'topLevelSideEffect' }],
      },
    ],
  });
});
