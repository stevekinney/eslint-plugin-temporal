# test-worker-runUntil-required

## What it does

Require workers created in tests to be bounded via worker.runUntil(...) to avoid hanging test suites.

## Why it matters

worker.runUntil bounds a test worker lifecycle to the test body, preventing hung test runs.

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
