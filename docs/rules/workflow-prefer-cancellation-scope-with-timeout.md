# workflow-prefer-cancellation-scope-with-timeout

## What it does

Prefer CancellationScope.withTimeout() over Promise.race() timeouts in workflows.

## Why it matters

CancellationScope.withTimeout integrates with Temporal cancellation semantics and avoids ad-hoc timeout races.

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
