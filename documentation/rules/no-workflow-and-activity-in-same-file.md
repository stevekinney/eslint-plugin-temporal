# no-workflow-and-activity-in-same-file

## What it does

Disallow importing both `@temporalio/workflow` and `@temporalio/activity` in the same file. These run in different environments and should not be mixed.

## Why it matters

Workflows execute inside a deterministic V8 isolate sandbox where Node.js APIs are unavailable, while activities run in normal Node.js. Importing both `@temporalio/workflow` and `@temporalio/activity` in the same file means the module will be bundled into the workflow sandbox, pulling in activity-side dependencies (e.g., `fs`, database clients) that will fail at runtime. Keeping them in separate files ensures each module only contains dependencies valid for its target environment.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { proxyActivities } from '@temporalio/workflow';
import { Context } from '@temporalio/activity';
```

### Correct

```ts
import { proxyActivities, sleep } from '@temporalio/workflow';
```

## When to disable

Disable if your shared code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
