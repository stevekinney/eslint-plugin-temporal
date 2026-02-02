# workflow-prefer-workflow-uuid

## What it does

Prefer uuid4() from @temporalio/workflow over other UUID libraries.

## Why it matters

uuid4() is deterministic under Temporal’s replay model. Third-party UUIDs often rely on randomness.

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
