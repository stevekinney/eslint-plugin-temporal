# workflow-require-explicit-payload-types

## What it does

Require explicit payload types for workflow inputs/outputs and message definitions.

## Why it matters

Explicit payload types make workflow APIs and message contracts clear and stable. Without them, Temporal's payload serialization may silently produce unexpected results or fail at runtime when the inferred type does not round-trip cleanly through JSON encoding. Declaring types also protects against accidental breaking changes when refactoring, since callers and workers both rely on the serialized shape of workflow arguments and return values.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input) {
  return 1;
}
```

### Correct

```ts
export async function myWorkflow(input: { id: string }): Promise<void> {}
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
