# workflow-no-bigint-in-payload

## What it does

Disallow bigint in workflow payload types unless a custom payload converter is configured.

## Why it matters

bigint is not JSON-serializable by default. Convert to string/number or configure a payload converter.

## Options

- allowBigInt

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input: bigint): Promise<void> {}
```

### Correct

```ts
export async function myWorkflow(input: number): Promise<void> {}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
