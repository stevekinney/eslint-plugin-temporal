# workflow-no-large-literal-payloads

## What it does

Warn when passing large literal arrays, objects, or strings as arguments to child workflows. Large payloads bloat workflow history.

## Why it matters

Child workflow payloads are stored in history. Large literals bloat history, slow replays, and increase storage costs.

## Options

- maxArrayElements
- maxObjectProperties
- maxStringLength

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
