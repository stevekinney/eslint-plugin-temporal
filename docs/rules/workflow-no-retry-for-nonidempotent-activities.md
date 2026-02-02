# workflow-no-retry-for-nonidempotent-activities

## What it does

Require non-idempotent activities to use retry.maximumAttempts: 1.

## Why it matters

Retries can duplicate side effects for non-idempotent activities. Limiting retries avoids accidental double-charges or writes.

## Options

- activityPatterns
- tag

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities({ retry: { maximumAttempts: 3 } });
await activities.chargeCustomer();
```

### Correct

```ts
const activities = proxyActivities({ retry: { maximumAttempts: 1 } });
await activities.chargeCard();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
