# workflow-no-nonserializable-types-in-payloads

## What it does

Disallow non-serializable types (functions, symbols, `Map`/`Set`, `RegExp`, etc.) in workflow payloads.

## Why it matters

All workflow inputs, outputs, and signal/query payloads pass through Temporal's `PayloadConverter`, which by default serializes values as JSON. Types like `Map`, `Set`, `RegExp`, functions, and symbols have no faithful JSON representation, so the converter will silently drop data or throw at runtime. Catching these at lint time prevents hard-to-debug serialization failures that only surface when the workflow is actually invoked or replayed.

## Options

- `disallowedTypes`
- `allowTypes`

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow(input: Map<string, string>): Promise<void> {}
```

### Correct

```ts
export async function myWorkflow(input: {
  id: string;
  tags: string[];
}): Promise<{ ok: boolean }> {
  return { ok: true };
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
