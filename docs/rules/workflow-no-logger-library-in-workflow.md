# workflow-no-logger-library-in-workflow

## What it does

Disallow logger libraries in workflows. Use log from @temporalio/workflow instead.

## Why it matters

Logger libraries can perform I/O and are not replay-aware. Use the workflow logger instead.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import pino from 'pino';
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('hello');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
