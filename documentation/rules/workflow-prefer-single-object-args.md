# workflow-prefer-single-object-args

## What it does

Prefer a single object parameter for workflows to keep signatures evolvable.

## Why it matters

Temporal serializes workflow arguments into history as a positional array. Adding, removing, or reordering positional parameters in a workflow signature is a breaking change that causes deserialization failures for in-flight executions during replay. A single object parameter lets you add new fields with defaults without altering the serialized shape, making workflow APIs safely evolvable across deployments.

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
