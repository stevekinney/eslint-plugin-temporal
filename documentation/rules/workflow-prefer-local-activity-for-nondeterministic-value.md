# workflow-prefer-local-activity-for-nondeterministic-value

## What it does

Suggest generating nondeterministic IDs in a local activity when they must remain stable across code changes.

## Why it matters

Random or UUID values generated with workflow PRNG functions like `uuid4()` are deterministic during replay, but their position in the PRNG sequence shifts whenever workflow code is reordered or modified. If such a value is used as a persisted identifier, a code change causes the replayed value to differ from the original, corrupting external references. Generating the value in a local activity records it in workflow history, ensuring it remains identical across replays regardless of code changes.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { uuid4 } from '@temporalio/workflow';
const orderId = uuid4();
```

### Correct

```ts
const jitter = Math.random();
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
