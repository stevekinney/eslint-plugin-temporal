# workflow-no-workflow-apis-in-query

## What it does

Disallow calling workflow APIs like `proxyActivities()`, `sleep()`, `condition()`, etc. in query handlers. Query handlers must be pure reads.

## Why it matters

Query handlers must be synchronous and side-effect free, returning a snapshot of workflow state without altering it. Calling workflow APIs such as `proxyActivities()` or `sleep()` inside a query handler schedules commands on the workflow timeline, which violates query semantics and causes the Temporal server to reject the query. Queries are executed during replay as well, so any side effects would produce nondeterministic command sequences and corrupt workflow history.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const getState = defineQuery('getState');
setHandler(getState, () => {
  const acts = proxyActivities();
  return acts;
});
```

### Correct

```ts
const getState = defineQuery('getState');
setHandler(getState, () => workflowState);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
