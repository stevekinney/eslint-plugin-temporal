# no-workflow-and-activity-in-same-file

## What it does

Disallow importing both @temporalio/workflow and @temporalio/activity in the same file. These run in different environments and should not be mixed.

## Why it matters

Workflows and activities run in different environments. Mixing them in one module risks importing the wrong runtime dependencies.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { proxyActivities } from '@temporalio/workflow';
import { Context } from '@temporalio/activity';
```

### Correct

```ts
import { proxyActivities, sleep } from '@temporalio/workflow';
```

## When to disable

Disable if your shared code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
