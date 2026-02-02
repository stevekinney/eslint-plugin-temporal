# workflow-no-fs-in-workflow

## What it does

Disallow filesystem access in workflows. Move filesystem I/O to activities.

## Why it matters

Temporal workflows execute inside a deterministic sandbox that does not provide access to the filesystem. Importing `fs`, `node:fs`, or similar modules will either fail at runtime or produce non-deterministic results that differ between the original execution and replay. All file I/O should be performed in activities, which run outside the sandbox and can safely interact with the operating system.

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
