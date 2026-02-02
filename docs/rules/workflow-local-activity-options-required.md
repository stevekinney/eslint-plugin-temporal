# workflow-local-activity-options-required

## What it does

Require proxyLocalActivities to configure explicit timeouts and a retry policy.

## Why it matters

Local activities still schedule commands in workflow history. Explicit timeouts and retry policies keep behavior predictable and reviewable.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const local = proxyLocalActivities();
```

### Correct

```ts
const local = proxyLocalActivities({
  startToCloseTimeout: '1m',
  retry: { maximumAttempts: 3 },
});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
