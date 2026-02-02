# workflow-no-dynamic-require

## What it does

Disallow `require()` calls in workflows. `require()` is not deterministic because it can load different modules based on runtime conditions.

## Why it matters

Temporal workflows are bundled into a deterministic sandbox, and `require()` calls bypass the static module resolution that the bundler relies on. At runtime, `require()` may resolve to different modules depending on the environment or file system state, producing different behavior during replay than during the original execution. This violates Temporal's determinism constraint and can trigger non-determinism errors that fail the workflow task.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const mod = require('some-module');
```

### Correct

```ts
import { something } from 'some-module';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
