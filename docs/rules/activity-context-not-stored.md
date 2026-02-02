# activity-context-not-stored

## What it does

Disallow storing Activity Context in variables that persist across async boundaries.

## Why it matters

Activity Context is attempt-specific. Storing it across async boundaries can use stale data or miss cancellation.

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
