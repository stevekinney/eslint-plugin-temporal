# activity-prefer-applicationfailure

## What it does

Prefer throwing ApplicationFailure over raw Error in activities.

## Why it matters

Activity code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that prefer throwing ApplicationFailure over raw Error in activities.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
throw new Error('Activity failed');
```

### Correct

```ts
throw ApplicationFailure.nonRetryable('Permanent failure');
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in activity code.
