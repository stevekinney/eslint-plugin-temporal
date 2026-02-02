# workflow-no-continue-as-new-in-update-handler

## What it does

Disallow calling `continueAsNew()` in update handlers. Continue-As-New from update handlers causes issues with the update lifecycle.

## Why it matters

Update handlers should complete within the current workflow run. Calling `continueAsNew()` inside an update handler terminates the current run before the update response can be sent back to the caller, leaving the caller waiting for a response that never arrives. This violates the update contract, which guarantees the caller receives either a result or an error. Move `continueAsNew()` logic to the main workflow function and use a flag or condition to trigger it after the update completes.

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
