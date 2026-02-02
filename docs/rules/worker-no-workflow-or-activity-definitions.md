# worker-no-workflow-or-activity-definitions

## What it does

Disallow importing workflow or activity definitions directly in worker files.

## Why it matters

Worker code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow importing workflow or activity definitions directly in worker files.

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
