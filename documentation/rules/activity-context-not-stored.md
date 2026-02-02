# activity-context-not-stored

## What it does

Disallow storing Activity `Context` in variables that persist across async boundaries.

## Why it matters

Activity `Context` is attempt-specific and tied to the current activity execution. Storing it in a variable that survives an `await` boundary means subsequent code may reference a stale context from a previous attempt, causing heartbeats or cancellation checks to target the wrong execution. At runtime, this can lead to missed cancellation signals, incorrect progress reporting, or silent data corruption when Temporal retries the activity.

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
