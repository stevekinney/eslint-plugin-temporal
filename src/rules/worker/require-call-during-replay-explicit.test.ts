import { describe } from 'bun:test';

import { createWorkerRuleTester } from '../../test-utilities/rule-tester.ts';
import { requireCallDuringReplayExplicit } from './require-call-during-replay-explicit.ts';

const ruleTester = createWorkerRuleTester();

describe('require-call-during-replay-explicit', () => {
  ruleTester.run('require-call-during-replay-explicit', requireCallDuringReplayExplicit, {
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
      // Sinks property with no object expression value (identifier reference)
      `Worker.create({
          sinks: existingSinks,
        });`,
      // Sinks key as a string literal instead of identifier
      `Worker.create({
          'sinks': {
            logger: {
              info: { fn() {}, callDuringReplay: true },
            },
          },
        });`,
    ],
    invalid: [
      // Multiple sink functions without callDuringReplay
      {
        code: `Worker.create({
            sinks: {
              logger: {
                info: { fn: () => {} },
                error: { fn: () => {} },
              },
            },
          });`,
        errors: [
          { messageId: 'callDuringReplayExplicit' },
          { messageId: 'callDuringReplayExplicit' },
        ],
      },
      // Deeply nested sink function missing callDuringReplay (no fn prop found, report sinkObject)
      {
        code: `Worker.create({
            sinks: {
              metrics: {
                counter: {
                  fn() { return; },
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
