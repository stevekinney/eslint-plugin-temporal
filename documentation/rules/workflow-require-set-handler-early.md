# workflow-require-set-handler-early

## What it does

Require `setHandler()` calls before the first `await` in workflow functions. This ensures handlers are registered before any async operations.

## Why it matters

Handlers registered after the first `await` can miss signals or updates that arrive while the workflow is suspended. If a signal is sent before the handler is registered, it is buffered but the handler will not process it until the next activation, which can cause unexpected ordering or lost data. Registering handlers synchronously at the top of the workflow function guarantees deterministic handling across replays and ensures no messages are missed regardless of timing.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
async function myWorkflow() {
  await sleep(1000);

  const mySignal = defineSignal('mySignal');
  setHandler(mySignal, () => {});
}
```

### Correct

```ts
async function myWorkflow() {
  const mySignal = defineSignal('mySignal');
  setHandler(mySignal, () => {});

  await sleep(1000);
}
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
