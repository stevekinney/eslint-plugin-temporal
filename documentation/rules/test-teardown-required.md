# test-teardown-required

## What it does

Require `TestWorkflowEnvironment.teardown()` to run in `afterAll`/`afterEach` when tests create a `TestWorkflowEnvironment`.

## Why it matters

`TestWorkflowEnvironment` spawns background processes (a Temporal test server and worker threads) that must be explicitly shut down. Without calling `teardown()`, these processes leak and accumulate across test files, eventually causing the test suite to hang, exhaust file descriptors, or run out of memory. Placing `teardown()` in an `afterAll` or `afterEach` block ensures cleanup happens even when individual tests fail.

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
