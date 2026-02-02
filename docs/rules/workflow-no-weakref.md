# workflow-no-weakref

## What it does

Disallow WeakRef usage in workflows. WeakRef behavior is non-deterministic and breaks workflow replay.

## Why it matters

WeakRef depends on garbage collection timing, which is nondeterministic and unsafe for workflow replay.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const ref = new WeakRef(target);
```

### Correct

```ts
const ref = { current: value };
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
