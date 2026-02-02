# workflow-no-client-import

## What it does

Disallow importing @temporalio/client in workflow files. Workflows cannot use the Client directly.

## Why it matters

Workflows cannot use the Temporal Client. Client calls are non-deterministic and must be done in activities or by workflow APIs.

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
