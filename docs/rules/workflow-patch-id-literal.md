# workflow-patch-id-literal

## What it does

Require patch IDs to be string literals for traceability and determinism.

## Why it matters

Patch IDs are long-lived version gates. Literals ensure they remain stable and searchable across the codebase.

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
