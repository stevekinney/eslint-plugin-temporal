# workflow-no-frequent-search-attribute-upserts

## What it does

Warn when upsertSearchAttributes is called inside loops (history bloat risk).

## Why it matters

Frequent search attribute updates inside loops bloat workflow history. Batch updates or move upserts outside loops.

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
