# worker-no-workflow-or-activity-definitions

## What it does

Disallow importing workflow or activity definitions directly in worker files.

## Why it matters

Workers should load workflows via `workflowsPath` and register activities through the `activities` option rather than importing them directly. Importing workflow definitions into the worker file causes them to execute outside the deterministic Temporal sandbox, bypassing replay safety guarantees. At runtime, this can lead to bundling errors, nondeterministic behavior, or activity code inadvertently running in the workflow isolate where Node.js APIs are unavailable.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { myWorkflow } from '../workflows';
```

### Correct

```ts
import type { MyWorkflow } from '../workflows';
```

## When to disable

Disable if your worker code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
