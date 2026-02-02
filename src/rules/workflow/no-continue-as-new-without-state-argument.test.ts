import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noContinueAsNewWithoutStateArgument } from './no-continue-as-new-without-state-argument.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-continue-as-new-without-state-argument', () => {
  ruleTester.run(
    'no-continue-as-new-without-state-argument',
    noContinueAsNewWithoutStateArgument,
    {
      valid: [
        `continueAsNew(state);`,
        `continueAsNew(state, extra);`,
        `continueAsNew(...args);`,
        `workflow.continueAsNew(state);`,
        `continueAsNew(undefined);`,
      ],
      invalid: [
        {
          code: `continueAsNew();`,
          errors: [
            {
              messageId: 'missingStateArgument',
              suggestions: [
                {
                  messageId: 'addStatePlaceholder',
                  output: `continueAsNew(/* TODO: pass workflow state */);`,
                },
              ],
            },
          ],
        },
        {
          code: `workflow.continueAsNew();`,
          errors: [
            {
              messageId: 'missingStateArgument',
              suggestions: [
                {
                  messageId: 'addStatePlaceholder',
                  output: `workflow.continueAsNew(/* TODO: pass workflow state */);`,
                },
              ],
            },
          ],
        },
      ],
    },
  );
});
