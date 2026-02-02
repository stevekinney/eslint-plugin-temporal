# activity-prefer-single-object-args

## What it does

Prefer a single object parameter for activities to keep signatures evolvable.

## Why it matters

Single object inputs make activity APIs easier to extend without breaking callers.

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
