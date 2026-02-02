# workflow-no-heavy-cpu-in-workflow

## What it does

Warn on CPU-heavy work in workflows. Move expensive computation to activities.

## Why it matters

Workflow tasks run on a single-threaded event loop shared with other workflows on the same worker. CPU-intensive loops block this thread, preventing other workflow tasks from making progress and causing task timeouts. During replay, every command is re-executed, so heavy computation compounds into even longer replay times. Move expensive work into activities, which run in their own execution context and can be individually timed out and retried.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
for (let i = 0; i < 20000; i += 1) {
  total += i;
}
```

### Correct

```ts
for (let i = 0; i < 100; i += 1) {
  total += i;
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
