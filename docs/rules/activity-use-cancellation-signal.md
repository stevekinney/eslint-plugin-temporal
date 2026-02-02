# activity-use-cancellation-signal

## What it does

Suggest passing cancellation signal to HTTP clients in activities.

## Why it matters

Activity code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that suggest passing cancellation signal to HTTP clients in activities.

## Options

- httpClients

## Autofix

No.

## Examples

### Incorrect

```ts
fetch(url);
```

### Correct

```ts
fetch(url, { signal: Context.current().cancellationSignal });
```

## When to disable

Disable only if you have a documented exception for this rule in activity code.
