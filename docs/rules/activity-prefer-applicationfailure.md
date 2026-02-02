# activity-prefer-applicationfailure

## What it does

Prefer throwing ApplicationFailure over raw Error in activities.

## Why it matters

ApplicationFailure captures retryability and failure type. Raw Error can lead to unintended retries or opaque failures.

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
