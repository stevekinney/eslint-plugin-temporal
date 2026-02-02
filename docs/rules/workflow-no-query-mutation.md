# workflow-no-query-mutation

## What it does

Disallow state mutations in query handlers. Query handlers must be pure reads.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow state mutations in query handlers. Query handlers must be pure reads.

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
