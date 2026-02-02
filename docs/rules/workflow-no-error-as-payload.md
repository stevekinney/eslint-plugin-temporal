# workflow-no-error-as-payload

## What it does

Disallow Error objects in workflow payload types. Use structured error shapes instead.

## Why it matters

Error objects do not serialize cleanly. Use structured error shapes when passing errors as payloads.

## Options

- allowTypes

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input: Error): Promise<void> {}
```

### Correct

```ts
export async function myWorkflow(input: { message: string }): Promise<void> {}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
