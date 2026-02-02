# workflow-no-node-or-dom-imports

## What it does

Disallow Node.js built-in modules and DOM APIs in workflow files.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow Node.js built-in modules and DOM APIs in workflow files.

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
