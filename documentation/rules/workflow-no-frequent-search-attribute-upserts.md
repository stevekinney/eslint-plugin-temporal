# workflow-no-frequent-search-attribute-upserts

## What it does

Warn when `upsertSearchAttributes()` is called inside loops (history bloat risk).

## Why it matters

Every call to `upsertSearchAttributes()` records a new event in the workflow's event history. Calling it inside a loop can generate thousands of events, rapidly bloating the history toward Temporal's size limit and degrading replay performance. Once the history exceeds the maximum size, the workflow is forced to continue-as-new or is terminated. Batch your attribute updates into a single call outside the loop to keep the history lean.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
for (const item of items) {
  upsertSearchAttributes({ Item: [item] });
}
```

### Correct

```ts
upsertSearchAttributes({ OrderId: [orderId] });
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
