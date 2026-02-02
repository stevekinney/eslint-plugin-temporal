# workflow-no-throw-raw-error

## What it does

Prefer throwing `ApplicationFailure` over raw `Error` in workflows.

## Why it matters

Temporal uses the failure type to decide whether a workflow or activity should be retried. A raw `Error` is treated as a retryable application failure by default, which may not match the developer's intent. `ApplicationFailure` lets you explicitly control retryability (via `ApplicationFailure.nonRetryable()`), attach a typed error name, and pass structured details that are preserved in the event history for debugging.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
throw new Error('Something went wrong');
```

### Correct

```ts
throw ApplicationFailure.nonRetryable('Something went wrong');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
