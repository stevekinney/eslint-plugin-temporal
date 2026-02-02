# no-temporal-internal-imports

## What it does

Disallow importing from internal Temporal SDK paths (e.g., `@temporalio/*/lib/*`).

## Why it matters

Internal SDK paths such as `@temporalio/workflow/lib/internal` are implementation details that can change or be removed in any minor or patch release without notice. Importing from them couples your code to a specific SDK version and will break on upgrades. Temporal's public entry points (e.g., `@temporalio/workflow`, `@temporalio/activity`) are the only supported API surface and are covered by semantic versioning guarantees.

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
