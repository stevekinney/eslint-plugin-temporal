# workflow-prefer-workflow-uuid

## What it does

Prefer `uuid4()` from `@temporalio/workflow` over other UUID libraries.

## Why it matters

`uuid4()` uses Temporal's deterministic PRNG, producing the same value on every replay of a given workflow execution. Third-party UUID libraries typically rely on `crypto.randomUUID()` or similar nondeterministic sources, which generate different values on each replay and trigger nondeterminism errors. Using the Temporal-provided `uuid4()` ensures that any UUID generated in workflow code is safe for replay.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
import * as uuid from 'uuid';
const id = uuid.v4();
```

### Correct

```ts
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();
```

## When to disable

Disable if your team standardizes on the alternative and you are comfortable with the trade-offs in workflow code.
