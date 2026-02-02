# workflow-no-network-in-workflow

## What it does

Disallow network access in workflows. Move HTTP calls to activities instead.

## Why it matters

Network calls are nondeterministic and not allowed in workflow code. Use activities for I/O.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
fetch('https://example.com');
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('hello');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
