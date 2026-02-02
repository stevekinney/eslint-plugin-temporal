# workflow-require-activity-timeouts

## What it does

Require timeout configuration when calling `proxyActivities()`.

## Why it matters

Without an explicit timeout, a stuck or slow activity can block workflow progress indefinitely, since Temporal will wait forever for the activity to complete. Setting `startToCloseTimeout` or `scheduleToCloseTimeout` ensures that the Temporal server fails the activity task after a bounded duration, allowing the workflow to handle the timeout and continue. This is critical for maintaining predictable workflow execution under failure conditions.

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
