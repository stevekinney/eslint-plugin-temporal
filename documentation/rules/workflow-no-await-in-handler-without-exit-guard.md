# workflow-no-await-in-handler-without-exit-guard

## What it does

Require workflows with async signal/update handlers that await work to use `condition(allHandlersFinished)` before exiting.

## Why it matters

Async handlers can still be running when a workflow exits. Waiting on `allHandlersFinished` avoids dropping in-flight handler work. Without this guard, the workflow may complete and close its history while a signal or update handler is still awaiting an activity or timer, causing that work to be silently abandoned. This is especially problematic for update handlers, where the caller expects a response that will never arrive if the workflow exits prematurely.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow() {
  const sig = defineSignal('sig');
  setHandler(sig, async () => {
    await sleep('1s');
  });
}
```

### Correct

```ts
export async function myWorkflow() {
  const sig = defineSignal('sig');
  setHandler(sig, async () => {
    await sleep('1s');
  });

  await condition(allHandlersFinished);
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
