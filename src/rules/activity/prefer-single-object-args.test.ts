import { describe } from 'bun:test';

import { createActivityRuleTester } from '../../test-utilities/rule-tester.ts';
import { preferSingleObjectActivityArgs } from './prefer-single-object-args.ts';

const ruleTester = createActivityRuleTester();

describe('prefer-single-object-args', () => {
  ruleTester.run('prefer-single-object-args', preferSingleObjectActivityArgs, {
    valid: [
      `export async function charge({ amount }: { amount: number }) {
        return amount;
      }`,
      `export const charge = async (input: { amount: number }) => input.amount;`,
      `function helper(a: number, b: number) { return a + b; }`,
      `const helper = (a: number, b: number) => a + b;`,
      `export default function (input: { amount: number }) {
        return input.amount;
      }`,
    ],
    invalid: [
      {
        code: `export async function charge(amount: number, currency: string) {
                return amount;
              }`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `export const charge = (amount: number, currency: string) => amount;`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `const create = (amount: number, currency: string) => amount;
               export { create };`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
      {
        code: `export default function charge(...args: any[]) {
                return args[0];
              }`,
        errors: [{ messageId: 'preferSingleObject' }],
      },
    ],
  });
});
