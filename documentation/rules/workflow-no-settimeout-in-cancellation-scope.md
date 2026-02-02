# workflow-no-settimeout-in-cancellation-scope

## What it does

Disallow `setTimeout` inside `CancellationScope` callbacks. Use `sleep()` for workflow-aware timers.

## Why it matters

`setTimeout` is a native JavaScript timer that has no awareness of Temporal's `CancellationScope`. When a scope is cancelled, `setTimeout` callbacks continue to fire because they sit outside the Temporal event loop, leading to unexpected behavior and potential resource leaks. Using `sleep()` from `@temporalio/workflow` ensures the timer is recorded in the event history, respects cancellation, and replays deterministically.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
await CancellationScope.withTimeout('1m', async () => {
  setTimeout(() => {}, 1000);
});
```

### Correct

```ts
setTimeout(() => {}, 1000);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
