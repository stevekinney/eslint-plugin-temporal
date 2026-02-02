# workflow-no-duplicate-patch-ids

## What it does

Disallow duplicate patch IDs within a file. Duplicate patch IDs cause unpredictable versioning behavior.

## Why it matters

Temporal's `patched()` API uses string IDs to create version gates that control which code path executes during replay. If the same patch ID appears more than once in a file, the runtime cannot distinguish between the two call sites, leading to ambiguous versioning where the wrong code branch may execute. This can cause non-determinism errors during replay or silently corrupt workflow state, since the event history records patch decisions by ID and expects each ID to map to a single version gate.

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
