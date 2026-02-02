# workflow-no-client-import

## What it does

Disallow importing @temporalio/client in workflow files. Workflows cannot use the Client directly.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow importing @temporalio/client in workflow files. Workflows cannot use the Client directly.

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
