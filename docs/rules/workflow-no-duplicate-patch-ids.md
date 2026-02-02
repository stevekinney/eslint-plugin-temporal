# workflow-no-duplicate-patch-ids

## What it does

Disallow duplicate patch IDs within a file. Duplicate patch IDs cause unpredictable versioning behavior.

## Why it matters

Patch IDs define version gates. Duplicates make versioning ambiguous and can lead to incorrect replay behavior.

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
