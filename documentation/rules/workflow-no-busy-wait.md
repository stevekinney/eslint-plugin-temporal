# workflow-no-busy-wait

## What it does

Disallow loops without `await` that could block the workflow task. Use `condition()` or `sleep()` for waiting.

## Why it matters

Busy-wait loops block the workflow task and can cause workflow task timeouts. A synchronous loop that never yields starves the Temporal event loop, preventing timers, signals, and other events from being processed. Use `sleep()` or `condition()` to yield control back to the Temporal runtime, which ensures the workflow remains responsive and its event history progresses correctly during replay.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
while (true) {
  doSomething();
}
```

### Correct

```ts
import { sleep } from '@temporalio/workflow';
while (shouldContinue) {
  await sleep('1s');
  checkStatus();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
