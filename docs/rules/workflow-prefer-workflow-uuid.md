# workflow-prefer-workflow-uuid

## What it does

Prefer uuid4() from @temporalio/workflow over other UUID libraries.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that prefer uuid4() from @temporalio/workflow over other UUID libraries.

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
