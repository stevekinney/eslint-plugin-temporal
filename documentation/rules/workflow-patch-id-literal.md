# workflow-patch-id-literal

## What it does

Require patch IDs to be string literals for traceability and determinism.

## Why it matters

Patch IDs are long-lived version gates stored in workflow history that control which code path executes during replay. Using a variable or computed expression means the value could change between deployments, causing replay to take the wrong branch and producing a nondeterminism error. String literals ensure that patch IDs remain stable, searchable across the codebase, and easy to audit when deprecating old versioning branches.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const id = 'patch-id';
if (patched(id)) {
}
```

### Correct

```ts
if (patched('my-patch-id')) {
  /* new code */
}
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
