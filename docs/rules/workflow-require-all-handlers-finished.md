# workflow-require-all-handlers-finished

## What it does

Suggest using condition(allHandlersFinished) before workflow completion when async handlers are present.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that suggest using condition(allHandlersFinished) before workflow completion when async handlers are present.

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
