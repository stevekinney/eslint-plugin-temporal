# workflow-no-wall-clock-assumptions

## What it does

Warn when comparing Date.now() to external timestamps, which can imply wall-clock assumptions in workflows.

## Why it matters

Workflow time is deterministic and advances with timers. Comparing Date.now() to external timestamps can encode brittle wall-clock assumptions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
if (Date.now() > input.deadline) {
  doWork();
}
```

### Correct

```ts
if (Date.now() > 0) {
  doWork();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
