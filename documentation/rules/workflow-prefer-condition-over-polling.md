# workflow-prefer-condition-over-polling

## What it does

Suggest using `condition()` instead of polling loops with `sleep()`. `condition()` is more efficient and results in cleaner workflow history.

## Why it matters

Polling with `sleep()` in a loop creates a new timer event in workflow history on every iteration, bloating the event history and increasing replay time proportionally. `condition()` registers a single efficient callback that fires when the predicate becomes true, producing minimal history entries. This keeps workflows fast to replay and avoids hitting Temporal's history size limits in long-running workflows.

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
