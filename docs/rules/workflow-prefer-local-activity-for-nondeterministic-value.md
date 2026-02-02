# workflow-prefer-local-activity-for-nondeterministic-value

## What it does

Suggest generating nondeterministic IDs in a local activity when they must remain stable across code changes.

## Why it matters

Random or UUID values that must survive refactors are more stable when generated in a local activity and returned to the workflow.

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
