# workflow-no-process-env

## What it does

Disallow process.env in workflow files. Environment variables cause replay divergence.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow process.env in workflow files. Environment variables cause replay divergence.

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
