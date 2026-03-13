import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferLocalActivityForNondeterministicValue } from './prefer-local-activity-for-nondeterministic-value.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-local-activity-for-nondeterministic-value', () => {
  ruleTester.run(
    'prefer-local-activity-for-nondeterministic-value',
    preferLocalActivityForNondeterministicValue,
    {
      valid: [
        // Math.random without ID-like variable name
        `const jitter = Math.random();`,
        // uuid4 used in activity call - safe because activity stores value
        `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const activities = proxyActivities({ startToCloseTimeout: '1m' });
          await activities.createOrder({ orderId: uuid4() });
        `,
        // uuid4 without ID-like name - no warning
        `
          import { uuid4 } from '@temporalio/workflow';
          const value = uuid4();
        `,
        // Namespace import - uuid4 used safely
        `
          import * as wf from '@temporalio/workflow';
          const randomValue = wf.uuid4();
        `,
        // uuid4 in persisted call - safe
        `
          import { uuid4 } from '@temporalio/workflow';
          startChild('myWorkflow', { workflowId: uuid4() });
        `,
        // Math.random with non-ID variable name
        `const delay = Math.random() * 1000;`,
        // Destructured proxy activities - safe in activity call
        `
          import { uuid4, proxyActivities } from '@temporalio/workflow';
          const { sendEmail } = proxyActivities({ startToCloseTimeout: '1m' });
          await sendEmail({ messageId: uuid4() });
        `,
        // Member expression: wf.proxyLocalActivities - uuid4 used in activity call is safe
        `
          import * as wf from '@temporalio/workflow';
          const local = wf.proxyLocalActivities({ startToCloseTimeout: '1m' });
          await local.generateToken({ requestId: wf.uuid4() });
        `,
        // Property with string literal key that is not ID-like
        `
          import { uuid4 } from '@temporalio/workflow';
          const data = { 'description': uuid4() };
        `,
        // uuid4 in object property within a member-expression persisted call (bracket notation)
        `
          import { uuid4 } from '@temporalio/workflow';
          import * as wf from '@temporalio/workflow';
          wf['executeChild']('myWorkflow', { workflowId: uuid4() });
        `,
        // Renamed uuid4 import used in non-ID-like variable
        `
          import { uuid4 as generateId } from '@temporalio/workflow';
          const value = generateId();
        `,
        // VariableDeclarator with non-Identifier id (destructuring) — skipped
        `
          import { uuid4 } from '@temporalio/workflow';
          const { x } = { x: uuid4() };
        `,
        // Renamed import causes uuid4LocalNames to have entry; bare uuid4() is NOT recognized
        // (uuid4LocalNames.has('uuid4') returns false when only 'myUuid' is tracked)
        `
          import { uuid4 as myUuid } from '@temporalio/workflow';
          const orderId = uuid4();
        `,
        // Assignment to non-Identifier (member expression) — skipped by AssignmentExpression handler
        `
          import { uuid4 } from '@temporalio/workflow';
          obj.userId = uuid4();
        `,
        // Property with number literal key — getPropertyKeyName returns null
        `
          import { uuid4 } from '@temporalio/workflow';
          const data = { 42: uuid4() };
        `,
        // uuid4 without workflow import — uuid4LocalNames.size === 0,
        // but variable name is not ID-like, so no report
        `const value = uuid4();`,
        // Property node whose parent is not ObjectExpression — should be skipped
        `
          import { uuid4 } from '@temporalio/workflow';
          const { workflowId = uuid4() } = {};
        `,
      ],
      invalid: [
        // uuid4 in ID-like variable name
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Math.random with token-like name
        {
          code: `const token = Math.random();`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 in object property with ID-like key (not in persisted call)
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const payload = { workflowId: uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 via assignment expression
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            let userId;
            userId = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Namespace import - uuid4 with ID-like name
        {
          code: `
            import * as wf from '@temporalio/workflow';
            const sessionId = wf.uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Math.random with ID-like suffix
        {
          code: `const userId = Math.random().toString(36);`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Object property with sessionId
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const data = { sessionId: uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // snake_case ID-like name
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const order_id = uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Nested PRNG call in expression
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const requestId = 'prefix-' + uuid4();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Object property with string literal key that is ID-like
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const data = { 'workflowId': uuid4() };
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Renamed uuid4 import used in ID-like variable — uuid4LocalNames has entries, callee matches
        {
          code: `
            import { uuid4 as generateId } from '@temporalio/workflow';
            const orderId = generateId();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // Renamed uuid4 import used in ID-like variable — uuid4LocalNames has entries, callee matches renamed import
        {
          code: `
            import { uuid4 as myUuid } from '@temporalio/workflow';
            const orderId = myUuid();
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 without importing from @temporalio/workflow (uuid4LocalNames.size === 0)
        // Falls through to callee.name === 'uuid4' check
        {
          code: `const orderId = uuid4();`,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 inside a function call expression assigned to ID-like variable
        // (findPrngCall traverses CallExpression arguments array — covers array branch)
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = wrap(uuid4());
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 inside an array expression assigned to ID-like variable
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = [uuid4()];
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
        // uuid4 inside a template literal assigned to ID-like variable
        {
          code: `
            import { uuid4 } from '@temporalio/workflow';
            const orderId = \`prefix-\${uuid4()}\`;
          `,
          errors: [{ messageId: 'preferLocalActivity' }],
        },
      ],
    },
  );
});
