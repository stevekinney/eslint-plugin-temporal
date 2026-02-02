# workflow-no-nondeterministic-control-flow

## What it does

Warn when control flow depends on time or randomness without an explicit determinism comment.

## Why it matters

Branching on time or randomness can break replay when code evolves. Require an explicit comment to make the choice intentional.

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
