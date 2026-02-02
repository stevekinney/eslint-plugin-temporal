# workflow-no-fs-in-workflow

## What it does

Disallow filesystem access in workflows. Move filesystem I/O to activities.

## Why it matters

Workflows run in a sandbox without filesystem access. File I/O must happen in activities.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import fs from 'fs';
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('ok');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
