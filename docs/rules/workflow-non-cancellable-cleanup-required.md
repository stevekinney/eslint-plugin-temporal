# workflow-non-cancellable-cleanup-required

## What it does

When handling cancellation and running cleanup with await, require CancellationScope.nonCancellable().

## Why it matters

Cleanup during cancellation should run inside a non-cancellable scope to ensure it completes safely.

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
