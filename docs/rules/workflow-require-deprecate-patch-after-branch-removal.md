# workflow-require-deprecate-patch-after-branch-removal

## What it does

Require deprecatePatch() after removing the fallback branch guarded by patched().

## Why it matters

Once the old branch is removed, deprecatePatch makes the versioning lifecycle explicit and prevents accidental replay failures.

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
