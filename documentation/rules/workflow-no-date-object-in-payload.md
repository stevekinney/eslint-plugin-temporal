# workflow-no-date-object-in-payload

## What it does

Disallow `Date` objects in workflow payload types. Prefer ISO strings or epoch timestamps.

## Why it matters

`Date` objects are not cleanly JSON-serializable by default -- `JSON.stringify()` converts them to strings, but `JSON.parse()` does not restore them back to `Date` instances. When Temporal serializes workflow arguments and return values into payloads, a `Date` will round-trip as a plain string, causing type mismatches and unexpected behavior on the receiving side. Use ISO 8601 strings or epoch timestamps instead to ensure predictable serialization and deserialization across workflow boundaries.

## Options

- `allowDate`

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
