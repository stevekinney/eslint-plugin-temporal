# workflow-require-activity-retry-policy

## What it does

Require explicit retry policy configuration in proxyActivities. Explicit retry policies make activity behavior more predictable and reviewable.

## Why it matters

Retries are part of activity semantics. Explicit policies make behavior reviewable and prevent surprises in production.

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
