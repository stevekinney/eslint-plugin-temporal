# workflow-require-handler-serialization-safe-types

## What it does

Require handler argument and return types to be serialization-safe for Temporal payloads.

## Why it matters

Handler inputs and outputs become workflow payloads. Enforcing serialization-safe types prevents runtime payload failures.

## Options

- disallowedTypes
- allowTypes

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
