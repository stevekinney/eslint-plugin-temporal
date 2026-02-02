# workflow-no-settimeout-in-cancellation-scope

## What it does

Disallow setTimeout inside CancellationScope callbacks. Use sleep() for workflow-aware timers.

## Why it matters

setTimeout bypasses Temporal’s cancellation semantics. sleep() ensures timers respect workflow cancellation.

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
