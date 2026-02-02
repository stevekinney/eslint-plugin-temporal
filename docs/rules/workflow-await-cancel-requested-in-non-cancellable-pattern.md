# workflow-await-cancel-requested-in-non-cancellable-pattern

## What it does

When using CancellationScope.nonCancellable in cancellation handlers, suggest awaiting cancelRequested so the workflow reacts to cancellation.

## Why it matters

Awaiting cancelRequested after non-cancellable cleanup keeps workflow cancellation behavior explicit and predictable.

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
