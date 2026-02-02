import { describe } from 'bun:test';

import { createWorkerRuleTester } from '../../test-utilities/rule-tester.ts';
import { ignoremodulesRequiresComment } from './ignoremodules-requires-comment.ts';

const ruleTester = createWorkerRuleTester();

describe('ignoremodules-requires-comment', () => {
  ruleTester.run('ignoremodules-requires-comment', ignoremodulesRequiresComment, {
    valid: [
      // With comment before
      `Worker.create({
          bundlerOptions: {
            // These modules are server-only and not used in workflows
            ignoreModules: ['pg', 'redis']
          }
        });`,

      // With comment after
      `Worker.create({
          bundlerOptions: {
            ignoreModules: ['pg', 'redis'] // Server-only modules not needed in sandbox
          }
        });`,

      // With inline comments on elements
      `Worker.create({
          bundlerOptions: {
            ignoreModules: [
              // Database driver - activities handle DB access
              'pg',
              // Redis - not used in workflows
              'redis'
            ]
          }
        });`,

      // No ignoreModules
      `Worker.create({
          bundlerOptions: {
            sourceMaps: true
          }
        });`,

      // No bundlerOptions
      `Worker.create({
          taskQueue: 'main'
        });`,
    ],
    invalid: [
      // No comment at all
      {
        code: `Worker.create({
            bundlerOptions: {
              ignoreModules: ['pg', 'redis']
            }
          });`,
        output: `Worker.create({
            bundlerOptions: {
              // TODO: Explain why these modules are ignored (e.g., server-only, not used in workflows)
              ignoreModules: ['pg', 'redis']
            }
          });`,
        errors: [{ messageId: 'requiresComment' }],
      },

      // Very short comment (not explanatory)
      {
        code: `Worker.create({
            bundlerOptions: {
              // ignore
              ignoreModules: ['pg']
            }
          });`,
        output: `Worker.create({
            bundlerOptions: {
              // ignore
              // TODO: Explain why these modules are ignored (e.g., server-only, not used in workflows)
              ignoreModules: ['pg']
            }
          });`,
        errors: [{ messageId: 'requiresComment' }],
      },
    ],
  });
});
