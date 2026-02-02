# workflow-require-handler-serialization-safe-types

## What it does

Require handler argument and return types to be serialization-safe for Temporal payloads.

## Why it matters

Handler inputs and outputs are serialized into Temporal payloads that cross the workflow boundary. Types like `Date`, `Map`, `Set`, or class instances do not survive JSON round-tripping, which causes silent data corruption or runtime deserialization errors on the receiving side. Catching these at lint time prevents hard-to-debug failures that only surface when a signal, query, or update is actually invoked against a running workflow.

## Options

- `disallowedTypes`
- `allowTypes`

## Autofix

No.

## Examples

### Incorrect

```ts
const sig = defineSignal<[Date]>('sig');
```

### Correct

```ts
const sig = defineSignal<[string, { id: string }]>('sig');
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
