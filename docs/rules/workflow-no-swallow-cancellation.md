# workflow-no-swallow-cancellation

## What it does

Require cancellation errors to be rethrown instead of swallowed in workflow catch blocks.

## Why it matters

Swallowing cancellation can leave workflows in an inconsistent state. Rethrowing preserves cancellation semantics.

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
