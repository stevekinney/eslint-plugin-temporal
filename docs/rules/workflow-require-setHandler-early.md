# workflow-require-setHandler-early

## What it does

Require setHandler calls before the first await in workflow functions. This ensures handlers are registered before any async operations.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that require setHandler calls before the first await in workflow functions. This ensures handlers are registered before any async operations.

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
