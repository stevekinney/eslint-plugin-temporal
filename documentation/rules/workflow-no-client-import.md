# workflow-no-client-import

## What it does

Disallow importing `@temporalio/client` in workflow files. Workflows cannot use the Client directly.

## Why it matters

Workflows cannot use the Temporal Client. `@temporalio/client` makes gRPC calls to the Temporal server, which are non-deterministic network operations that will break replay. At runtime, the deterministic sandbox will reject or fail on these imports. Use workflow APIs like `startChild()` or `continueAsNew()` for workflow-to-workflow communication, and move any direct Client usage into activities.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { Client } from '@temporalio/client';
```

### Correct

```ts
import { proxyActivities, startChild } from '@temporalio/workflow';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
