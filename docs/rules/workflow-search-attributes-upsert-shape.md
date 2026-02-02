# workflow-search-attributes-upsert-shape

## What it does

Require upsertSearchAttributes values to be arrays and removals to use empty arrays.

## Why it matters

Search attribute updates must use arrays. Using [] for removals avoids runtime errors and keeps history tidy.

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
