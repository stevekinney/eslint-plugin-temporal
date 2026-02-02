# workflow-sink-no-return-value

## What it does

Disallow using return values from sink calls. Sinks return void and their return values should not be used.

## Why it matters

Sink calls do not return values. Using their return values is a logic error that can hide missed side effects.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const sinks = proxySinks();
const result = sinks.myLogger.info('message');
```

### Correct

```ts
const sinks = proxySinks();
sinks.myLogger.info('message');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
