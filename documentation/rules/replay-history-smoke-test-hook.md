# replay-history-smoke-test-hook

## What it does

Require a replay history smoke test hook file that exports a function invoking `Worker.runReplayHistories()`.

## Why it matters

Replay history smoke tests catch nondeterminism errors before code reaches production by replaying recorded workflow histories through `Worker.runReplayHistories()` in CI. Without this safety net, a workflow code change that breaks determinism will only surface as a nondeterminism error at runtime, potentially corrupting in-flight workflows. Running replay tests on every commit ensures backward compatibility with existing workflow executions.

## Options

- `hookFile`
- `exportName`
- `requireRunReplayHistories`
- `reportOnce`

## Autofix

No.

## Examples

### Incorrect

```ts
const ok = true;
```

### Correct

```ts
const ok = true;
```

## When to disable

Disable only if you have a documented exception for this rule in test code.
