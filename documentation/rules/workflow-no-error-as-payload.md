# workflow-no-error-as-payload

## What it does

Disallow `Error` objects in workflow payload types. Use structured error shapes instead.

## Why it matters

`Error` objects do not serialize cleanly because properties like `message`, `stack`, and `cause` are non-enumerable and are silently dropped by `JSON.stringify()`. When Temporal serializes workflow payloads, an `Error` passed as an argument or return value will arrive on the other side as an empty object, losing all diagnostic information. Use plain objects with explicit fields like `{ message: string; code: string }` or Temporal's `ApplicationFailure` to ensure error details survive serialization across workflow boundaries.

## Options

- `allowTypes`

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
