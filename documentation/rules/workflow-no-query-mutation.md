# workflow-no-query-mutation

## What it does

Disallow state mutations in query handlers registered via `setHandler()`. Query handlers must be pure reads.

## Why it matters

Queries are executed synchronously against the workflow's current state and are not recorded in the event history. Because queries can be called at any time and in any order, mutating workflow state inside a query handler introduces nondeterminism: replay will not reproduce those mutations, causing the workflow's in-memory state to diverge from the replayed history. Keeping query handlers as pure reads preserves the Temporal query contract and ensures consistent behavior across replays.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const query = defineQuery('count');
setHandler(query, () => {
  queryCount = queryCount + 1;
  return count;
});
```

### Correct

```ts
const getStatus = defineQuery('status');
setHandler(getStatus, () => {
  return { status: workflowStatus, count: itemCount };
});
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
