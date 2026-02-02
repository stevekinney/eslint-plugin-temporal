# test-teardown-required

## What it does

Require TestWorkflowEnvironment.teardown() to run in afterAll/afterEach when tests create a TestWorkflowEnvironment.

## Why it matters

TestWorkflowEnvironment spawns workers and resources that must be cleaned up. teardown() prevents leaked processes and hanging suites.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { TestWorkflowEnvironment } from '@temporalio/testing';
let testEnv;
beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});
```

### Correct

```ts
import { TestWorkflowEnvironment } from '@temporalio/testing';
let testEnv;
beforeAll(async () => {
  testEnv = await TestWorkflowEnvironment.createTimeSkipping();
});
afterAll(async () => {
  await testEnv.teardown();
});
```

## When to disable

Disable only if you have a documented exception for this rule in test code.
