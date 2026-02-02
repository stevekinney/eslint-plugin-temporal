# workflow-no-heavy-cpu-in-workflow

## What it does

Warn on CPU-heavy work in workflows. Move expensive computation to activities.

## Why it matters

CPU-heavy work can block the workflow task and slow replays. Move expensive computation to activities.

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
