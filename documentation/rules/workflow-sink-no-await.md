# workflow-sink-no-await

## What it does

Disallow awaiting sink calls. Sinks are fire-and-forget and return `void` -- awaiting them is a mistake.

## Why it matters

Sinks are fire-and-forget side-effect channels that execute outside the deterministic workflow sandbox. Awaiting a sink call is meaningless because the call returns `undefined` synchronously, but the `await` still introduces an extra microtask tick that can alter workflow execution order during replay. This can lead to subtle non-determinism bugs and gives a false impression that the sink delivery is confirmed before proceeding.

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
