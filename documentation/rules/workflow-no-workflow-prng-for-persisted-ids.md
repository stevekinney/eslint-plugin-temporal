# workflow-no-workflow-prng-for-persisted-ids

## What it does

Warn when workflow PRNG values (`uuid4()`/`Math.random()`) are used in persisted IDs or payloads.

## Why it matters

Workflow PRNG values are deterministic within a single replay sequence, but their position in that sequence can shift when workflow code is modified or reordered. If a PRNG-generated value is passed directly to an activity or persisted externally, a code change can cause the replayed value to differ from what was originally stored, leading to data inconsistencies. Persisted IDs should be generated in activities or local activities so they are recorded in workflow history and remain stable across code changes.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { uuid4, proxyActivities } from '@temporalio/workflow';
const activities = proxyActivities({ startToCloseTimeout: '1m' });
await activities.createOrder({ id: uuid4() });
```

### Correct

```ts
import { uuid4, proxyActivities } from '@temporalio/workflow';
const orderId = uuid4();
const activities = proxyActivities({ startToCloseTimeout: '1m' });
await activities.createOrder({ id: orderId });
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
