# workflow-no-assert-in-production-workflow

## What it does

Disallow Node.js `assert` usage in workflow code outside tests to avoid replay failures and workflow task retries.

## Why it matters

Node.js `assert` failures throw `AssertionError`, which the Temporal worker treats as a non-application error, causing the workflow task to be retried indefinitely rather than failing the workflow. This can lead to stuck workflows that consume worker resources without making progress. Use `ApplicationFailure` from `@temporalio/workflow` instead, which properly signals a workflow-level failure and lets Temporal handle it according to your retry policy.

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
