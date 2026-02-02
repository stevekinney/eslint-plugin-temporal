# workflow-activity-timeout-duration-format

## What it does

Enforce a consistent duration literal format for activity timeouts in proxyActivities options.

## Why it matters

Consistent activity timeout formats make proxyActivities options easier to review and prevent unit mix-ups.

## Options

See the rule schema in the source for supported options.

## Autofix

No.

## Examples

### Incorrect

```ts
const activities = proxyActivities({ startToCloseTimeout: 1000 });
```

### Correct

```ts
const activities = proxyActivities({
  startToCloseTimeout: 1000,
  scheduleToCloseTimeout: 2000,
});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
