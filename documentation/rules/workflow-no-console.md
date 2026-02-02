# workflow-no-console

## What it does

Disallow `console.*` in workflow files. Use `log` from `@temporalio/workflow` instead.

## Why it matters

`console.*` output is not replay-aware and will produce duplicate log lines every time the workflow replays from history. The Temporal `log` API from `@temporalio/workflow` is replay-safe: it suppresses log calls during replay so you only see each message once. Using `console.*` also bypasses any structured logging and observability integrations configured on the Temporal worker.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
console.log('hello');
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('hello');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
