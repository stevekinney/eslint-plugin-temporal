# workflow-signal-handler-returns-void

## What it does

Signal handlers must return `void`. Return values from signal handlers are ignored.

## Why it matters

Signal handlers do not return values to callers -- Temporal's signal mechanism is fire-and-forget from the caller's perspective. Any value returned from a signal handler is silently discarded by the SDK, so code that returns a value creates a false expectation that the caller will receive it. Enforcing `void` return types keeps the API honest and prevents developers from confusing signals with updates, which do support return values.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const mySignal = defineSignal('my-signal');
setHandler(mySignal, (data) => {
  workflowState = data;
  return { updated: true };
});
```

### Correct

```ts
const mySignal = defineSignal('my-signal');
setHandler(mySignal, (data) => {
  workflowState = data;
});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
