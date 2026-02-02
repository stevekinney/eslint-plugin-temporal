# workflow-no-unsafe-global-mutation

## What it does

Disallow mutations to globalThis or built-in prototypes in workflows. Such mutations are non-deterministic and break workflow replay.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow mutations to globalThis or built-in prototypes in workflows. Such mutations are non-deterministic and break workflow replay.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
globalThis.foo = 'bar';
```

### Correct

```ts
const foo = 'bar';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
