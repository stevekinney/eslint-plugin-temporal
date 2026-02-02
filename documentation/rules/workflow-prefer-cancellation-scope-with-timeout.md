# workflow-prefer-cancellation-scope-with-timeout

## What it does

Prefer `CancellationScope.withTimeout()` over `Promise.race()` timeouts in workflows.

## Why it matters

`CancellationScope.withTimeout()` integrates with Temporal's cancellation semantics, automatically cancelling child activities and timers when the timeout fires. Using `Promise.race()` instead leaves the losing branch running in the background, leaking activities that continue executing and consuming resources. Because `Promise.race()` is not cancellation-aware, it also produces unexpected command sequences during replay that can trigger nondeterminism errors.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
await Promise.race([sleep('1m'), activities.doWork()]);
```

### Correct

```ts
await CancellationScope.withTimeout('1m', async () => {
  await activities.doWork();
});
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
