# test-worker-run-until-required

## What it does

Require workers created in tests to be bounded via `worker.runUntil(...)` to avoid hanging test suites.

## Why it matters

`worker.runUntil(...)` ties the worker's lifecycle to a specific promise, ensuring the worker shuts down as soon as the test operation completes. Without it, the worker polls for tasks indefinitely, causing the test process to hang and never exit. This is a common pitfall in Temporal integration tests because `Worker.create()` starts a long-lived polling loop that has no built-in timeout.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { Worker } from '@temporalio/worker';
await Worker.create({ workflowsPath: '/tmp/workflows' });
```

### Correct

```ts
import { Worker } from '@temporalio/worker';
import { TestWorkflowEnvironment } from '@temporalio/testing';
const env = await TestWorkflowEnvironment.createLocal();
const worker = await Worker.create({ workflowsPath: '/tmp/workflows' });
await worker.runUntil(env, async () => {});
```

## When to disable

Disable only if you have a documented exception for this rule in test code.
