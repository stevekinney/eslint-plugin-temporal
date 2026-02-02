# workflow-sink-args-must-be-cloneable

## What it does

Require sink call arguments to be cloneable data (no functions, class instances, or `Error` objects).

## Why it matters

Sink arguments are serialized via the structured clone algorithm to cross from the deterministic workflow sandbox to the external sink handler. Non-cloneable values like functions, class instances, or `Error` objects will throw a `DataCloneError` at runtime, silently dropping the sink call. Catching these issues at lint time ensures that logging, metrics, and other sink-based side effects reliably reach their destination.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const sinks = proxySinks();
sinks.logger.info(() => {});
```

### Correct

```ts
const sinks = proxySinks();
sinks.logger.info({ message: 'ok', tags: ['a', 'b'] });
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
