# workflow-require-activity-retry-policy

## What it does

Require explicit retry policy configuration in `proxyActivities()`. Explicit retry policies make activity behavior more predictable and reviewable.

## Why it matters

Temporal applies a default retry policy with unlimited retries when none is specified, which can cause a failing activity to retry indefinitely, consuming resources and delaying workflow progress. Making the retry policy explicit forces developers to reason about failure modes -- maximum attempts, backoff intervals, and non-retryable error types -- at design time. This prevents surprises in production and makes activity behavior auditable in code review.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities({
  startToCloseTimeout: '1m',
});
```

### Correct

```ts
const activities = proxyActivities({
  startToCloseTimeout: '1m',
  retry: { maximumAttempts: 3 },
});
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
