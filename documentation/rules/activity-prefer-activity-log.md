# activity-prefer-activity-log

## What it does

Prefer `log` from `@temporalio/activity` over `console.*` for structured logging.

## Why it matters

The `log` object from `@temporalio/activity` automatically includes Temporal context such as workflow ID, run ID, and activity type in every log entry, making it far easier to correlate logs during debugging and in observability dashboards. Using `console.*` loses all of this metadata, producing unstructured output that is difficult to trace back to a specific workflow execution. Structured activity logs are especially important in production where multiple activities run concurrently across workers.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
console.log('message');
```

### Correct

```ts
import { log } from '@temporalio/activity';
log.info('Processing request');
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in activity code.
