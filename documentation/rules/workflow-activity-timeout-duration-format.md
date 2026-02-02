# workflow-activity-timeout-duration-format

## What it does

Enforce a consistent duration literal format for activity timeouts in `proxyActivities()` options.

## Why it matters

Consistent activity timeout formats make `proxyActivities()` options easier to review and prevent unit mix-ups. When durations use inconsistent formats (e.g., mixing raw milliseconds with string literals like `'1m'`), it becomes easy to misread a value and accidentally set a timeout that is orders of magnitude too short or too long. Because activity timeouts are recorded in workflow history and govern retry and scheduling behavior, an incorrect value can cause activities to time out prematurely or hang far longer than intended.

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
