# workflow-no-retry-for-nonidempotent-activities

## What it does

Require non-idempotent activities to use `retry.maximumAttempts: 1`.

## Why it matters

When Temporal retries a failed activity, it re-executes the activity function from scratch. For non-idempotent operations like charging a credit card or sending an email, retries can duplicate real-world side effects, leading to double-charges, duplicate messages, or corrupted data. Setting `maximumAttempts: 1` ensures these activities run at most once, forcing the developer to handle failure recovery explicitly in the workflow logic.

## Options

- `activityPatterns`
- `tag`

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
