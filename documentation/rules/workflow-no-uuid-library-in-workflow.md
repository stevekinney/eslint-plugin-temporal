# workflow-no-uuid-library-in-workflow

## What it does

Disallow UUID libraries in workflows. Use `uuid4()` from `@temporalio/workflow` or generate IDs in activities.

## Why it matters

Standard UUID libraries (e.g., the `uuid` package) use `crypto.getRandomValues()` or similar nondeterministic sources. Calling them inside a workflow produces a different value on every replay, triggering a nondeterminism error. Temporal provides a deterministic `uuid4()` helper in `@temporalio/workflow` that is seeded from the workflow's replay-safe random source, ensuring the same ID is generated on both the original run and every subsequent replay.

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
