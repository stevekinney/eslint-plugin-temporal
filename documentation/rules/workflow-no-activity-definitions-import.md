# workflow-no-activity-definitions-import

## What it does

Disallow importing activity implementations in workflow files. Use `proxyActivities()` instead.

## Why it matters

Workflow code runs in the Temporal deterministic sandbox. Importing activity implementations can pull in Node.js APIs and nondeterministic side effects, which will break replay determinism. At runtime, the sandbox may throw unexpected errors or silently produce different results on replay when non-deterministic modules are loaded. Use `proxyActivities()` to obtain type-safe activity stubs that schedule activities through the Temporal runtime instead of executing them inline.

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
