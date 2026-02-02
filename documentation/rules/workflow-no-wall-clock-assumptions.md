# workflow-no-wall-clock-assumptions

## What it does

Warn when comparing `Date.now()` to external timestamps, which can imply wall-clock assumptions in workflows.

## Why it matters

Inside a Temporal workflow, `Date.now()` returns the deterministic replay clock, not the actual wall-clock time. Comparing it against externally supplied timestamps (e.g., a deadline from a workflow input) encodes an assumption that the two clocks are synchronized, which is false during replay -- the replay clock jumps forward based on recorded timer events. This mismatch can cause branches to evaluate differently on replay, producing nondeterminism errors.

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
