# workflow-no-workflow-apis-in-query

## What it does

Disallow calling workflow APIs like proxyActivities, sleep, condition, etc. in query handlers. Query handlers must be pure reads.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow calling workflow APIs like proxyActivities, sleep, condition, etc. in query handlers. Query handlers must be pure reads.

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
