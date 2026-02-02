# replay-history-smoke-test-hook

## What it does

Require a replay history smoke test hook file that exports a function invoking Worker.runReplayHistories().

## Why it matters

Replay history smoke tests catch nondeterminism before production by running Worker.runReplayHistories() in CI.

## Options

- hookFile
- exportName
- requireRunReplayHistories
- reportOnce

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
