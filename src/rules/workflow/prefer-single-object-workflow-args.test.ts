import { describe } from 'bun:test';

import { createWorkflowRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferSingleObjectWorkflowArgs } from './prefer-single-object-workflow-args.ts';

const ruleTester = createWorkflowRuleTester();

describe('prefer-single-object-workflow-args', () => {
  ruleTester.run('prefer-single-object-workflow-args', preferSingleObjectWorkflowArgs, {
    valid: [
      `export async function myWorkflow({ orderId }: { orderId: string }) {
        return orderId;
      }`,
      `export const myWorkflow = async (input: { orderId: string }) => input.orderId;`,
      `function helper(a: number, b: number) { return a + b; }`,
      `const helper = (a: number, b: number) => a + b;`,
      `export default function (input: { orderId: string }) {
        return input.orderId;
      }`,
    ],
    invalid: [
      {
        code: `export async function myWorkflow(orderId: string, userId: string) {
                return orderId + userId;
              }`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `export const myWorkflow = (orderId: string, userId: string) => orderId;`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `const createWorkflow = (orderId: string, userId: string) => orderId;
               export { createWorkflow };`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `export default function workflow(...args: any[]) {
                return args[0];
              }`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
    ],
  });
});
