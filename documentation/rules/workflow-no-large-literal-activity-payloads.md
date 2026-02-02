# workflow-no-large-literal-activity-payloads

## What it does

Warn when passing large literal arrays, objects, or strings to activities. Large payloads bloat workflow history.

## Why it matters

Every argument passed to an activity via `proxyActivities()` is serialized and recorded in the workflow's event history. Large literal payloads inflate the history size, which slows down replay and increases Temporal Server storage costs. If the history grows past Temporal's size limit, the workflow will be forced to continue-as-new or be terminated. Instead, pass references (such as object IDs or storage keys) and let the activity fetch the full data.

## Options

- `maxArrayElements`
- `maxObjectProperties`
- `maxStringLength`

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
