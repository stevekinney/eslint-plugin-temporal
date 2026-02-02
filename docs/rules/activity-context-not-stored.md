# activity-context-not-stored

## What it does

Disallow storing Activity Context in variables that persist across async boundaries.

## Why it matters

Activity code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow storing Activity Context in variables that persist across async boundaries.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const ctx = Context.current();
```

### Correct

```ts
Context.current().heartbeat();
```

## When to disable

Disable only if you have a documented exception for this rule in activity code.
