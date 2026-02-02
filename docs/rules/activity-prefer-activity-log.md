# activity-prefer-activity-log

## What it does

Prefer log from @temporalio/activity over console.\* for structured logging.

## Why it matters

Activity logs include Temporal context and are structured for observability. console.\* loses metadata and consistency.

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
