# workflow-no-setinterval

## What it does

Disallow setInterval() in workflow files. There is no deterministic equivalent in Temporal.

## Why it matters

setInterval is not replay-safe and can ignore cancellation semantics. Use sleep in a loop or condition().

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
setInterval(callback, 1000);
```

### Correct

```ts
import { sleep } from '@temporalio/workflow';
while (shouldContinue) {
  await sleep('5s');
  doWork();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
