# workflow-require-activity-timeouts

## What it does

Require timeout configuration when calling proxyActivities().

## Why it matters

Timeouts prevent stuck activities and make workflow progress deterministic under failure conditions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities();
```

### Correct

```ts
const activities = proxyActivities({ startToCloseTimeout: '1 minute' });
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
