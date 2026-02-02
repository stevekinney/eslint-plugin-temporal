# workflow-no-date-object-in-payload

## What it does

Disallow Date objects in workflow payload types. Prefer ISO strings or epoch timestamps.

## Why it matters

Date objects are not JSON-serializable by default. Use ISO strings or epoch values.

## Options

- allowDate

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input: Date): Promise<void> {}
```

### Correct

```ts
export async function myWorkflow(input: string): Promise<void> {}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
