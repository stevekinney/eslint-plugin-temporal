# worker-no-workflow-or-activity-definitions

## What it does

Disallow importing workflow or activity definitions directly in worker files.

## Why it matters

Workers should load workflows by path and pass activity implementations explicitly. Importing definitions can bundle code into the wrong environment.

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
