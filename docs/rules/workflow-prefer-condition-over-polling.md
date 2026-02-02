# workflow-prefer-condition-over-polling

## What it does

Suggest using condition() instead of polling loops with sleep(). Condition is more efficient and results in cleaner workflow history.

## Why it matters

Polling with timers creates extra workflow tasks and history. condition() is more efficient and replay-friendly.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
while (true) {
  if (state.ready) break;
  await sleep(1000);
}
```

### Correct

```ts
await condition(() => state.ready);
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
