# workflow-no-crypto-random-uuid

## What it does

Disallow crypto.randomUUID() in workflow files. Use uuid4() from @temporalio/workflow instead.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow crypto.randomUUID() in workflow files. Use uuid4() from @temporalio/workflow instead.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
const id = crypto.randomUUID();
```

### Correct

```ts
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
