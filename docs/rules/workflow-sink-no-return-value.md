# workflow-sink-no-return-value

## What it does

Disallow using return values from sink calls. Sinks return void and their return values should not be used.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow using return values from sink calls. Sinks return void and their return values should not be used.

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
