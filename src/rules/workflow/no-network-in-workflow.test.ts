import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { noNetworkInWorkflow } from './no-network-in-workflow.ts';

const ruleTester = createWorkflowRuleTester();

describe('no-network-in-workflow', () => {
  ruleTester.run('no-network-in-workflow', noNetworkInWorkflow, {
    valid: [
      `import { log } from '@temporalio/workflow';
       log.info('hello');`,
      `const request = createRequest();
       request.run();`,
      `import type { Client } from 'graphql-request';
       export type { Client };`,
    ],
    invalid: [
      {
        code: `fetch('https://example.com');`,
        errors: [{ messageId: 'noNetwork' }],
      },
      {
        code: `import axios from 'axios';`,
        errors: [{ messageId: 'noNetwork' }],
      },
      {
        code: `import { request } from 'graphql-request';`,
        errors: [{ messageId: 'noNetwork' }],
      },
      {
        code: `new WebSocket('wss://example.com');`,
        errors: [{ messageId: 'noNetwork' }],
      },
      {
        code: `export { request } from 'node-fetch';`,
        errors: [{ messageId: 'noNetwork' }],
      },
    ],
  });
});
