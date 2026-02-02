# workflow-no-worker-import

## What it does

Disallow importing `@temporalio/worker` in workflow files. Workflows run in a sandboxed environment and cannot use Worker APIs.

## Why it matters

Workers run outside the workflow sandbox in a separate Node.js environment. Importing `@temporalio/worker` into workflow code crosses environment boundaries, pulling in modules that are unavailable in the sandboxed V8 isolate where workflows execute. At runtime this causes import failures or undefined behavior, and it breaks the determinism guarantees that Temporal relies on for safe replay.

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
