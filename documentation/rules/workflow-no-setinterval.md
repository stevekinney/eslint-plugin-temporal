# workflow-no-setinterval

## What it does

Disallow `setInterval()` in workflow files. There is no deterministic equivalent in Temporal.

## Why it matters

`setInterval()` relies on wall-clock time, which does not advance deterministically during replay. Temporal skips real time on replay, so interval callbacks would either never fire or fire at the wrong moments, producing nondeterminism errors. Additionally, `setInterval()` does not respect Temporal's cancellation scopes. Use `sleep()` in a loop or `condition()` instead, as these are recorded in the event history and behave correctly during replay and cancellation.

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
