# workflow-non-cancellable-cleanup-required

## What it does

When handling cancellation and running cleanup with `await`, require `CancellationScope.nonCancellable()`.

## Why it matters

When a workflow is cancelled, all outstanding cancellation scopes propagate the cancellation. If cleanup code uses `await` without wrapping it in `CancellationScope.nonCancellable()`, the cleanup itself will be immediately cancelled before it can complete. At runtime this means critical teardown steps -- such as compensating transactions or notifying external systems -- are silently skipped, leaving the system in an inconsistent state.

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
    await cleanup();
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
    throw err;
  }
}
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
