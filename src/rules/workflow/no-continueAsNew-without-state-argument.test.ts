import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noContinueAsNewWithoutStateArgument } from './no-continueAsNew-without-state-argument.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-continueAsNew-without-state-argument', () => {
  ruleTester.run(
    'no-continueAsNew-without-state-argument',
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
          errors: [{ messageId: 'missingStateArgument' }],
        },
        {
          code: `workflow.continueAsNew();`,
          errors: [{ messageId: 'missingStateArgument' }],
        },
      ],
    },
  );
});
