# workflow-no-async-query-handler

## What it does

Disallow async query handlers. Query handlers must be synchronous per Temporal SDK contract.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow async query handlers. Query handlers must be synchronous per Temporal SDK contract.

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
