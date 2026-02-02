# workflow-search-attributes-upsert-shape

## What it does

Require `upsertSearchAttributes()` values to be arrays and removals to use empty arrays.

## Why it matters

The Temporal server expects search attribute values to be arrays, even for single-valued attributes. Passing a bare scalar like `{ OrderId: 'abc' }` instead of `{ OrderId: ['abc'] }` causes a runtime error from the SDK or server that only surfaces when the workflow actually executes the upsert. Using an empty array `[]` is the correct way to remove a search attribute; using `null` or `undefined` will also fail at runtime.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
upsertSearchAttributes({ OrderId: 'abc' });
```

### Correct

```ts
upsertSearchAttributes({ OrderId: [orderId], Status: ['active'] });
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
