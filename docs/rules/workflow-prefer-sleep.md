# workflow-prefer-sleep

## What it does

Prefer sleep() from @temporalio/workflow over setTimeout(). Temporal sleep integrates with cancellation scopes.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that prefer sleep() from @temporalio/workflow over setTimeout(). Temporal sleep integrates with cancellation scopes.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
setTimeout(callback, 1000);
```

### Correct

```ts
import { sleep } from '@temporalio/workflow';
await sleep('5s');
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
