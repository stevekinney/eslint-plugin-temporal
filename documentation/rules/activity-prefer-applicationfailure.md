# activity-prefer-applicationfailure

## What it does

Prefer throwing `ApplicationFailure` over raw `Error` in activities.

## Why it matters

`ApplicationFailure` lets you explicitly control whether a failure is retryable or non-retryable, and attach a structured failure type that workflows can match against. When you throw a raw `Error`, Temporal treats it as retryable by default, which can cause infinite retry loops for permanent failures like invalid input or missing resources. Using `ApplicationFailure` also ensures that failure details are properly serialized and visible in the Temporal UI, rather than appearing as opaque error messages.

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
