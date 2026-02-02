# workflow-no-date-now-tight-loop

## What it does

Warn when Date.now() is called multiple times without yielding in workflow code.

## Why it matters

Workflow time only advances with timers. Multiple Date.now() calls without yielding can mislead logic and create replay surprises.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const start = Date.now();
const end = Date.now();
```

### Correct

```ts
import { sleep } from '@temporalio/workflow';
const start = Date.now();
await sleep('1s');
const end = Date.now();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
