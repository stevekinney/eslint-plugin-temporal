# workflow-require-all-handlers-finished

## What it does

Suggest using `condition(allHandlersFinished)` before workflow completion when async handlers are present.

## Why it matters

Signal and update handlers may still be executing asynchronous work when the main workflow function returns. If the workflow completes without waiting, those in-flight handlers are silently dropped, which can cause lost updates, incomplete side effects, or data inconsistencies. Calling `await condition(allHandlersFinished)` before returning ensures that every registered handler has finished its work, preserving the workflow's correctness guarantees.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow() {
  const mySignal = defineSignal('signal');
  setHandler(mySignal, async (data) => {
    await processData(data);
  });

  return state;
}
```

### Correct

```ts
export async function myWorkflow() {
  const mySignal = defineSignal('signal');
  setHandler(mySignal, (data) => {
    state = data;
  });
  return state;
}
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
