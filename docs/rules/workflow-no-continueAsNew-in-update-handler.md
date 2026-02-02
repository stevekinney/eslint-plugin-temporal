# workflow-no-continueAsNew-in-update-handler

## What it does

Disallow calling continueAsNew in update handlers. Continue-As-New from update handlers causes issues with the update lifecycle.

## Why it matters

Update handlers should complete within the current run. Continuing as new inside a handler can interrupt in-flight updates and violate update semantics.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const myUpdate = defineUpdate('myUpdate');
setHandler(myUpdate, async (value) => {
  state.value = value;
  await continueAsNew(state);
});
```

### Correct

```ts
const myUpdate = defineUpdate('myUpdate');
setHandler(myUpdate, async (value) => {
  state.value = value;
  return state.value;
});
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
