# workflow-no-swallow-cancellation

## What it does

Require `CancelledFailure` errors to be rethrown instead of swallowed in workflow catch blocks.

## Why it matters

When a Temporal workflow or `CancellationScope` is cancelled, the SDK throws a `CancelledFailure` to unwind the call stack. If a catch block silently swallows this error, the workflow continues running as if nothing happened, leaving it in an inconsistent state and preventing cleanup logic in parent scopes from executing. Rethrowing `CancelledFailure` ensures the cancellation propagates correctly through the scope hierarchy and the workflow terminates or cleans up as intended.

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
    return;
  }
}
```

### Correct

```ts
try {
  await doWork();
} catch (err) {
  if (err instanceof CancelledFailure) {
    throw err;
  }
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
