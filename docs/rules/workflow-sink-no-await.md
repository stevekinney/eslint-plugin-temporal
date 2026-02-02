# workflow-sink-no-await

## What it does

Disallow awaiting sink calls. Sinks are fire-and-forget and return void - awaiting them is a mistake.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow awaiting sink calls. Sinks are fire-and-forget and return void - awaiting them is a mistake.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const sinks = proxySinks();
await sinks.myLogger('message');
```

### Correct

```ts
const sinks = proxySinks();
sinks.myLogger.info('message');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
