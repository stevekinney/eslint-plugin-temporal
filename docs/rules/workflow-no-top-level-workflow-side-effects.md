# workflow-no-top-level-workflow-side-effects

## What it does

Disallow top-level workflow commands (sleep, activities, child workflows) outside workflow functions.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow top-level workflow commands (sleep, activities, child workflows) outside workflow functions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { sleep } from '@temporalio/workflow';
sleep('1s');
```

### Correct

```ts
import { proxyActivities, defineSignal, defineQuery } from '@temporalio/workflow';
const activities = proxyActivities();
const mySignal = defineSignal('mySignal');
const myQuery = defineQuery('myQuery');
export async function myWorkflow() {
  await activities.doThing();
}
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
