# workflow-no-large-literal-payloads

## What it does

Warn when passing large literal arrays, objects, or strings as arguments to child workflows. Large payloads bloat workflow history.

## Why it matters

Arguments passed to child workflows via `startChild()` or `executeChild()` are serialized and stored in the parent workflow's event history. Large literal payloads inflate the history size, slowing replay and increasing Temporal Server storage costs. If the history exceeds the size limit, the parent workflow may be forced to continue-as-new or be terminated. Pass references or identifiers instead and let the child workflow retrieve the full data from a data store.

## Options

- `maxArrayElements`
- `maxObjectProperties`
- `maxStringLength`

## Autofix

No.

## Examples

### Incorrect

```ts
await startChild(myWorkflow, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
```

### Correct

```ts
await startChild(myWorkflow, [1, 2, 3, 4, 5]);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
