# workflow-prefer-condition-over-polling

## What it does

Suggest using condition() instead of polling loops with sleep(). Condition is more efficient and results in cleaner workflow history.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that suggest using condition() instead of polling loops with sleep(). Condition is more efficient and results in cleaner workflow history.

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
