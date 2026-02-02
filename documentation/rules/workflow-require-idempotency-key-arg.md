# workflow-require-idempotency-key-arg

## What it does

Require an idempotency key (or workflow identifiers) when calling non-idempotent activities.

## Why it matters

Idempotency keys let you safely retry or deduplicate non-idempotent activities that touch external systems. Temporal automatically retries failed activities based on retry policies, so an activity like `chargeCard()` could execute more than once if it times out after completing the side effect but before reporting success. Passing an idempotency key allows the external system to recognize duplicate requests and prevents double-charging, duplicate emails, or other repeated side effects.

## Options

- `activityPatterns`
- `keyFields`
- `allowWorkflowIdentifiers`

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities();
await activities.chargeCard({ amount: 42 });
```

### Correct

```ts
const activities = proxyActivities();
await activities.sendReceipt({ requestId: 'req-1' });
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
