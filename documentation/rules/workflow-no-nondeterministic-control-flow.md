# workflow-no-nondeterministic-control-flow

## What it does

Warn when control flow depends on time or randomness (e.g., `Math.random()`, `Date.now()`) without an explicit determinism comment.

## Why it matters

Branching on time or randomness produces different execution paths across replays, leading to nondeterminism errors that fail the workflow task. Because Temporal replays the entire workflow history to rebuild state, any branch that resolved differently on the original run versus the replay causes the SDK to throw a nondeterminism exception. Adding an explicit comment forces developers to acknowledge the risk and document why the branch is safe.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
if (Math.random() > 0.5) {
  doWork();
}
```

### Correct

```ts
if (isReady) {
  doWork();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
