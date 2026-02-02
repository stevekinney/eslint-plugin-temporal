# workflow-no-workflow-prng-for-persisted-ids

## What it does

Warn when workflow PRNG values (uuid4/Math.random) are used in persisted IDs or payloads.

## Why it matters

Workflow PRNG values can shift when code changes. Persisted IDs should be generated in activities or local activities to remain stable.

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
