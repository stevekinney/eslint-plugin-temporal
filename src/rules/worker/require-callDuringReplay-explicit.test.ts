import { describe } from 'bun:test';

import { createWorkerRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireCallDuringReplayExplicit } from './require-callDuringReplay-explicit.ts';

const ruleTester = createWorkerRuleTester();

describe('require-callDuringReplay-explicit', () => {
  ruleTester.run('require-callDuringReplay-explicit', requireCallDuringReplayExplicit, {
    valid: [
      `Worker.create({
          sinks: {
            logger: {
              info: {
                fn: (info, message) => {
                  console.log(message);
                },
                callDuringReplay: false,
              },
            },
          },
        });`,
      `Worker.create({
          sinks: {
            metrics: {
              increment: {
                fn() {
                  return;
                },
                callDuringReplay: true,
              },
            },
          },
        });`,
      `Worker.create({ taskQueue: 'main' });`,
      `const sinks = {
          logger: {
            info: { fn() {}, callDuringReplay: false },
          },
        };
        Worker.create({ sinks });`,
    ],
    invalid: [
      {
        code: `Worker.create({
            sinks: {
              logger: {
                info: {
                  fn: () => {},
                },
              },
            },
          });`,
        errors: [{ messageId: 'callDuringReplayExplicit' }],
      },
      {
        code: `Worker.create({
            sinks: {
              logger: {
                info: {
                  fn: () => {},
                },
                warn: {
                  fn: () => {},
                  callDuringReplay: false,
                },
              },
            },
          });`,
        errors: [{ messageId: 'callDuringReplayExplicit' }],
      },
    ],
  });
});
