# workflow-no-throw-raw-error

## What it does

Prefer throwing ApplicationFailure over raw Error in workflows.

## Why it matters

ApplicationFailure preserves retryability and failure semantics. Throwing raw Error can hide intent and break retry policies.

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
