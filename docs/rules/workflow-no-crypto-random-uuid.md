# workflow-no-crypto-random-uuid

## What it does

Disallow crypto.randomUUID() in workflow files. Use uuid4() from @temporalio/workflow instead.

## Why it matters

crypto.randomUUID() is nondeterministic. Use uuid4() in workflows or generate IDs in activities when you need true randomness.

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
