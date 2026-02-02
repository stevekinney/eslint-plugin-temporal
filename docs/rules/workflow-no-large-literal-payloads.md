# workflow-no-large-literal-payloads

## What it does

Warn when passing large literal arrays, objects, or strings as arguments to activities or child workflows. Large payloads bloat workflow history.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that warn when passing large literal arrays, objects, or strings as arguments to activities or child workflows. Large payloads bloat workflow history.

## Options

- maxArrayElements
- maxObjectProperties
- maxStringLength

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities();
await activities.process([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
```

### Correct

```ts
const activities = proxyActivities();
await activities.process([1, 2, 3, 4, 5]);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
