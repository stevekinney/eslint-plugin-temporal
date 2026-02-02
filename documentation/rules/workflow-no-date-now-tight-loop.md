# workflow-no-date-now-tight-loop

## What it does

Warn when `Date.now()` is called multiple times without yielding in workflow code.

## Why it matters

In the Temporal workflow sandbox, `Date.now()` returns the current workflow time, which only advances when the workflow yields to the event loop (e.g., via `sleep()` or awaiting an activity). Multiple `Date.now()` calls without an intervening yield will all return the same timestamp, which can silently break elapsed-time calculations and timeout logic. During replay, these calls are resolved from the recorded history, so any logic that assumes time has passed between consecutive calls will behave unpredictably.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const start = Date.now();
const end = Date.now();
```

### Correct

```ts
import { sleep } from '@temporalio/workflow';
const start = Date.now();
await sleep('1s');
const end = Date.now();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
