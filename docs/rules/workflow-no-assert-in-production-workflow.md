# workflow-no-assert-in-production-workflow

## What it does

Disallow Node.js assert usage in workflow code outside tests to avoid replay failures and workflow task retries.

## Why it matters

Node assert failures can trigger workflow task retries and replay issues. Prefer explicit errors or ApplicationFailure.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import assert from 'assert';
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('ok');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
