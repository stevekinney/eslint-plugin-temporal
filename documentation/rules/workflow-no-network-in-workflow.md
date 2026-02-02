# workflow-no-network-in-workflow

## What it does

Disallow network access in workflows. Move HTTP calls (e.g., `fetch()`, `XMLHttpRequest`) to activities instead.

## Why it matters

Network calls are nondeterministic and not allowed in workflow code. During replay, Temporal re-executes workflow code and expects identical outcomes for each step; a network call that returns different data or fails will cause a nondeterminism error and halt the workflow. All I/O should be performed inside activities, which are recorded in the event history and safely skipped on replay.

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
