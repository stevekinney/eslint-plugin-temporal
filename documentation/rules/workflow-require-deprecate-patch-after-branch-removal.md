# workflow-require-deprecate-patch-after-branch-removal

## What it does

Require `deprecatePatch()` after removing the fallback branch guarded by `patched()`.

## Why it matters

Once the old branch is removed, calling `deprecatePatch()` makes the versioning lifecycle explicit and prevents accidental replay failures. Without it, Temporal's replay mechanism cannot distinguish between a workflow that never had the patch and one that already migrated past it, which can cause non-determinism errors during replay of older workflow histories. Completing the patch lifecycle ensures that the workflow definition remains safe to deploy alongside still-running executions that were started on the previous code path.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
if (patched('feature')) {
  newBehavior();
}
```

### Correct

```ts
if (patched('feature')) {
  newBehavior();
} else {
  oldBehavior();
}
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
