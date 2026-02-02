# workflow-await-cancel-requested-in-non-cancellable-pattern

## What it does

When using `CancellationScope.nonCancellable` in cancellation handlers, suggest awaiting `cancelRequested` so the workflow reacts to cancellation.

## Why it matters

Awaiting `cancelRequested` after non-cancellable cleanup keeps workflow cancellation behavior explicit and predictable. Without this step, the workflow may complete its cleanup inside `CancellationScope.nonCancellable()` but then continue executing as if cancellation never happened, leading to unexpected state changes or additional work being scheduled. During replay, Temporal expects the workflow to follow the same cancellation path, so skipping the `cancelRequested` await can cause the replay to diverge from the original execution history.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
try {
  await doWork();
} catch (err) {
  if (err instanceof CancelledFailure) {
    await CancellationScope.nonCancellable(async () => {
      await cleanup();
    });
    throw err;
  }
}
```

### Correct

```ts
try {
  await doWork();
} catch (err) {
  if (err instanceof CancelledFailure) {
    await CancellationScope.nonCancellable(async () => {
      await cleanup();
    });
    await CancellationScope.current().cancelRequested;
    throw err;
  }
}
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
