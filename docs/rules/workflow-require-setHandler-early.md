# workflow-require-setHandler-early

## What it does

Require setHandler calls before the first await in workflow functions. This ensures handlers are registered before any async operations.

## Why it matters

Handlers registered after the first await can miss signals/updates. Registering early ensures deterministic handling.

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
