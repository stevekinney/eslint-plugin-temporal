# workflow-no-uuid-library-in-workflow

## What it does

Disallow UUID libraries in workflows. Use uuid4() from @temporalio/workflow or generate IDs in activities.

## Why it matters

UUID libraries typically rely on randomness. Use uuid4() or generate IDs in activities.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { v4 } from 'uuid';
```

### Correct

```ts
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
