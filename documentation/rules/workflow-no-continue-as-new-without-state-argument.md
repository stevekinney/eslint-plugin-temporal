# workflow-no-continue-as-new-without-state-argument

## What it does

Require `continueAsNew()` to receive workflow state arguments so state is preserved across runs.

## Why it matters

`continueAsNew()` starts a new workflow execution with a fresh event history, but it does not automatically carry over any in-memory state from the previous run. If you call `continueAsNew()` without passing the current workflow state as arguments, all accumulated state is silently lost and the new run begins from scratch. This is especially dangerous in long-running workflows that use `continueAsNew()` to avoid hitting the event history size limit, since the workflow may appear to restart correctly while actually losing critical progress.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
continueAsNew();
```

### Correct

```ts
continueAsNew(state);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
