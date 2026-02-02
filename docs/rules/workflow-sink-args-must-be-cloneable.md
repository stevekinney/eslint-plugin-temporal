# workflow-sink-args-must-be-cloneable

## What it does

Require sink call arguments to be cloneable data (no functions, class instances, or Errors).

## Why it matters

Sink arguments are serialized across the workflow boundary. Non-cloneable values like functions or class instances fail at runtime.

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
