# workflow-no-await-in-handler-without-exit-guard

## What it does

Require workflows with async signal/update handlers that await work to use condition(allHandlersFinished) before exiting.

## Why it matters

Async handlers can still be running when a workflow exits. Waiting on allHandlersFinished avoids dropping in-flight handler work.

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
