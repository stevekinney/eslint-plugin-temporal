# no-temporal-internal-imports

## What it does

Disallow importing from internal Temporal SDK paths (e.g., @temporalio/_/lib/_).

## Why it matters

Internal SDK paths are not stable APIs. Using public entry points prevents breakage on SDK upgrades.

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
