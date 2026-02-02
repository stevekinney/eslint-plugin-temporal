# workflow-no-node-or-dom-imports

## What it does

Disallow Node.js built-in modules and DOM APIs in workflow files.

## Why it matters

Workflows run in a restricted sandbox without Node or DOM APIs. Importing them will fail at runtime or break determinism.

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
