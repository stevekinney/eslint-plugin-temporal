# workflow-no-logger-library-in-workflow

## What it does

Disallow logger libraries in workflows. Use `log` from `@temporalio/workflow` instead.

## Why it matters

Third-party logger libraries (such as `pino`, `winston`, or `bunyan`) perform I/O operations like writing to files or network sockets, which are non-deterministic and forbidden inside the workflow sandbox. They are also not replay-aware, meaning they will emit duplicate log entries every time a workflow replays. The built-in `log` from `@temporalio/workflow` is replay-safe and automatically suppresses log output during replay, giving you clean, deduplicated logs.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import pino from 'pino';
```

### Correct

```ts
import { log } from '@temporalio/workflow';
log.info('hello');
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
