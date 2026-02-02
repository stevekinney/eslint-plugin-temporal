# workflow-no-nonserializable-types-in-payloads

## What it does

Disallow non-serializable types (functions, symbols, Map/Set, RegExp, etc.) in workflow payloads.

## Why it matters

Workflow payloads must be serializable. Disallowing non-serializable types avoids runtime payload converter failures.

## Options

- disallowedTypes
- allowTypes

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
