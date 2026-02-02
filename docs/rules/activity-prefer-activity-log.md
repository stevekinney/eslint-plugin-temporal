# activity-prefer-activity-log

## What it does

Prefer log from @temporalio/activity over console.\* for structured logging.

## Why it matters

Activity code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that prefer log from @temporalio/activity over console.\* for structured logging.

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
