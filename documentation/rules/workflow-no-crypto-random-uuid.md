# workflow-no-crypto-random-uuid

## What it does

Disallow `crypto.randomUUID()` in workflow files. Use `uuid4()` from `@temporalio/workflow` instead.

## Why it matters

`crypto.randomUUID()` produces a different value on every invocation, which means it will generate a different UUID during replay than it did during the original execution. This breaks Temporal's determinism requirement and causes a non-determinism error that fails the workflow task. The `uuid4()` function from `@temporalio/workflow` is replay-safe because its output is recorded in the event history, ensuring the same value is returned during replay.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
const id = crypto.randomUUID();
```

### Correct

```ts
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();
```

## When to disable

Disable if your workflow code intentionally uses `crypto.randomUUID()` and you have documented the determinism or operational trade-offs.
