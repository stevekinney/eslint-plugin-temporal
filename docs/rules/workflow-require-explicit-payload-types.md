# workflow-require-explicit-payload-types

## What it does

Require explicit payload types for workflow inputs/outputs and message definitions.

## Why it matters

Explicit payload types make workflow APIs and message contracts clear and stable.

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
