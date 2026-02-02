# activity-prefer-single-object-args

## What it does

Prefer a single object parameter for activities to keep signatures evolvable.

## Why it matters

Activity arguments are serialized to the Temporal event history and must remain backward-compatible across deployments. When you use positional parameters, adding or reordering arguments is a breaking change that can cause deserialization failures during in-flight workflow replays. A single object parameter lets you add new optional fields without breaking existing callers or corrupting replayed activity inputs.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function charge(amount: number, currency: string) {
  return amount;
}
```

### Correct

```ts
export async function charge({ amount }: { amount: number }) {
  return amount;
}
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in activity code.
