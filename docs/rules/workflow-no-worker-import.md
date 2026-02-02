# workflow-no-worker-import

## What it does

Disallow importing @temporalio/worker in workflow files. Workflows run in a sandboxed environment and cannot use Worker APIs.

## Why it matters

Workers run outside the workflow sandbox. Importing worker code into workflows crosses environment boundaries and breaks determinism.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { Worker } from '@temporalio/worker';
```

### Correct

```ts
import { proxyActivities, startChild } from '@temporalio/workflow';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
