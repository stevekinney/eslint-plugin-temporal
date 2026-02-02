# workflow-no-top-level-workflow-side-effects

## What it does

Disallow top-level workflow commands (`sleep()`, activities, child workflows) outside workflow functions.

## Why it matters

Top-level side effects execute at module-load time, before a workflow execution context exists. Calling `sleep()`, invoking an activity, or starting a child workflow at the top level will throw at runtime because there is no active workflow context to schedule these commands against. These calls must live inside a workflow function so that Temporal can record them in the event history and replay them deterministically.

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
