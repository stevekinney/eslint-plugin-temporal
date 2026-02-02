# workflow-no-finalization-registry

## What it does

Disallow `FinalizationRegistry` usage in workflows. `FinalizationRegistry` behavior is non-deterministic and breaks workflow replay.

## Why it matters

`FinalizationRegistry` callbacks fire based on garbage collection timing, which varies between executions and is entirely outside Temporal's control. During replay, the GC may run at different points than it did during the original execution, causing finalization callbacks to fire in a different order or not at all. This violates Temporal's determinism requirement and can lead to non-determinism errors or unpredictable side effects that corrupt workflow state.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const registry = new FinalizationRegistry((heldValue) => {
  console.log('cleaned up', heldValue);
});
```

### Correct

```ts
function cleanup() {
  resource.dispose();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
