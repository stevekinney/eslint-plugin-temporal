# workflow-no-console

## What it does

Disallow console.\* in workflow files. Use log from @temporalio/workflow instead.

## Why it matters

Console output is not replay-aware and can duplicate logs. Workflow logging integrates with Temporal and is safe for replay.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
console.log('hello');
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('hello');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
