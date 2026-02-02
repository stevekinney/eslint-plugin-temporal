# workflow-no-finalization-registry

## What it does

Disallow FinalizationRegistry usage in workflows. FinalizationRegistry behavior is non-deterministic and breaks workflow replay.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow FinalizationRegistry usage in workflows. FinalizationRegistry behavior is non-deterministic and breaks workflow replay.

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
