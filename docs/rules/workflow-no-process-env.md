# workflow-no-process-env

## What it does

Disallow process.env in workflow files. Environment variables cause replay divergence.

## Why it matters

Environment variables can change between runs and replays. Pass configuration explicitly via workflow inputs.

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
