# workflow-no-async-query-handler

## What it does

Disallow async query handlers. Query handlers must be synchronous per the Temporal SDK contract.

## Why it matters

Queries must be synchronous and side-effect free. An async query handler would schedule commands or yield control during what is supposed to be a read-only operation, blocking the workflow task and introducing nondeterminism during replay. At runtime, the Temporal SDK rejects promises returned from query handlers, which can cause confusing errors. Keep query handlers as simple, synchronous reads of workflow state.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const myQuery = defineQuery('my-query');
setHandler(myQuery, async () => {
  return await getState();
});
```

### Correct

```ts
const myQuery = defineQuery('my-query');
setHandler(myQuery, () => {
  return { status: 'ok' };
});
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
