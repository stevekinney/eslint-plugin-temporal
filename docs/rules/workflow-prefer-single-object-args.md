# workflow-prefer-single-object-args

## What it does

Prefer a single object parameter for workflows to keep signatures evolvable.

## Why it matters

Single object inputs make workflow APIs easier to extend without breaking callers.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(orderId: string, userId: string) {
  return orderId + userId;
}
```

### Correct

```ts
export async function myWorkflow({ orderId }: { orderId: string }) {
  return orderId;
}
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
