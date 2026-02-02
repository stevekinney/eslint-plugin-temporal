# no-temporal-internal-imports

## What it does

Disallow importing from internal Temporal SDK paths (e.g., @temporalio/_/lib/_).

## Why it matters

Shared code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow importing from internal Temporal SDK paths (e.g., @temporalio/_/lib/_).

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
import { something } from '@temporalio/workflow/lib/internal';
```

### Correct

```ts
import { proxyActivities } from '@temporalio/workflow';
```

## When to disable

Disable if your shared code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
