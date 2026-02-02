# workflow-no-console

## What it does

Disallow console.\* in workflow files. Use log from @temporalio/workflow instead.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow console.\* in workflow files. Use log from @temporalio/workflow instead.

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
