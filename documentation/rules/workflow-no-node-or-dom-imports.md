# workflow-no-node-or-dom-imports

## What it does

Disallow Node.js built-in modules (e.g., `fs`, `http`, `child_process`) and DOM APIs in workflow files.

## Why it matters

Temporal workflows run inside a deterministic V8 sandbox that deliberately excludes Node.js built-ins and browser DOM APIs. Importing these modules will either throw at runtime when the sandbox cannot resolve them, or introduce nondeterministic side effects that break replay. Any I/O or platform-specific work should be delegated to activities via `proxyActivities()`.

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
import { proxyActivities } from '@temporalio/workflow';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
