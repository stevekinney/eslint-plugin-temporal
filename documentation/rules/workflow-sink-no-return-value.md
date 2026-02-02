# workflow-sink-no-return-value

## What it does

Disallow using return values from sink calls. Sinks return `void` and their return values should not be used.

## Why it matters

Sink calls always return `undefined` because sinks are fire-and-forget channels that cross the workflow sandbox boundary. Assigning or checking the return value of a sink call is a logic error that suggests the developer expects a meaningful result, which can mask bugs where the intended side effect was never delivered. Catching this at lint time helps ensure that sink usage is correct and that developers use queries or activities instead when a return value is needed.

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
