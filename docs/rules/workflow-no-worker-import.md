# workflow-no-worker-import

## What it does

Disallow importing @temporalio/worker in workflow files. Workflows run in a sandboxed environment and cannot use Worker APIs.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow importing @temporalio/worker in workflow files. Workflows run in a sandboxed environment and cannot use Worker APIs.

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
