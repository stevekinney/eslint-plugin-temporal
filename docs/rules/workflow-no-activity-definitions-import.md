# workflow-no-activity-definitions-import

## What it does

Disallow importing activity implementations in workflow files. Use proxyActivities() instead.

## Why it matters

Workflow code runs in the deterministic sandbox. Importing activity implementations can pull in Node APIs and nondeterminism; only proxy activities from the workflow API.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { myActivity } from '../activities';
```

### Correct

```ts
import type { MyActivity } from '../activities';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
