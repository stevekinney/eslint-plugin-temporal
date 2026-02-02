# workflow-no-mixed-scope-exports

## What it does

Disallow exporting `Worker`/`Client`/`Activity` values from workflow files. Keep workflow exports scoped to workflow code and message definitions.

## Why it matters

Workflow modules should only export workflow code and message definitions. Exporting `Worker` or `Client` references from a workflow file blurs runtime boundaries, causing the Temporal sandbox to pull in modules that rely on Node.js APIs unavailable during replay. At runtime this can trigger import errors or, worse, silently introduce nondeterministic behavior that surfaces only when a workflow is replayed on a different worker.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export { Worker } from '@temporalio/worker';
```

### Correct

```ts
import { defineSignal } from '@temporalio/workflow';
export const mySignal = defineSignal('mySignal');
export async function myWorkflow() {}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
