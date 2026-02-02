# workflow-no-any-in-workflow-public-api

## What it does

Disallow any in workflow public API payload types (workflow inputs/outputs and message definitions).

## Why it matters

Avoiding any in public workflow APIs improves correctness and keeps payload contracts explicit.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input: any): Promise<void> {}
```

### Correct

```ts
export async function myWorkflow(input: { id: string }): Promise<void> {}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
