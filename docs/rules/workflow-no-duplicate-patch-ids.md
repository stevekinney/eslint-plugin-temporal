# workflow-no-duplicate-patch-ids

## What it does

Disallow duplicate patch IDs within a file. Duplicate patch IDs cause unpredictable versioning behavior.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow duplicate patch IDs within a file. Duplicate patch IDs cause unpredictable versioning behavior.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
if (patched('my-feature')) {
  newBehavior();
}
if (patched('my-feature')) {
  alsoPatchedCode();
}
```

### Correct

```ts
if (patched('feature-v1')) {
  newBehavior();
}
if (patched('feature-v2')) {
  newerBehavior();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
