# workflow-no-process-env

## What it does

Disallow `process.env` in workflow files. Environment variables cause replay divergence.

## Why it matters

Environment variables can differ between the original execution and a replay, or between workers running on different hosts. If workflow logic branches on a `process.env` value, replaying the same history on a worker with a different environment produces a nondeterminism error and fails the workflow task. Configuration should be passed explicitly as workflow inputs so it is recorded in the event history and remains stable across replays.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const apiKey = process.env.API_KEY;
```

### Correct

```ts
const pid = process.pid;
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
