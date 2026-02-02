# workflow-no-bigint-in-payload

## What it does

Disallow `bigint` in workflow payload types unless a custom payload converter is configured.

## Why it matters

`bigint` is not JSON-serializable by default, so passing a `bigint` value as a workflow argument or return value will throw a `TypeError` at runtime when the Temporal SDK attempts to serialize it. This causes the workflow task to fail and retry in a loop. Convert to `string` or `number`, or configure a custom payload converter that handles `bigint` serialization.

## Options

- `allowBigInt`

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
