# workflow-prefer-sleep

## What it does

Prefer `sleep()` from `@temporalio/workflow` over `setTimeout()`. Temporal `sleep()` integrates with cancellation scopes.

## Why it matters

`sleep()` is a workflow-aware timer that is recorded in workflow history and respects `CancellationScope` propagation. `setTimeout()` is not tracked by the Temporal runtime, so it does not produce the expected timer events during replay, leading to nondeterminism errors. Additionally, `setTimeout()` callbacks are not cancelled when a `CancellationScope` is cancelled, which can cause unexpected behavior in cleanup and timeout scenarios.

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
