# workflow-replay-testing-required-comment

## What it does

Require a `replay-tested` comment when workflow versioning logic is changed.

## Why it matters

Replay testing catches nondeterminism errors that are invisible at development time but cause workflow failures in production when existing histories are replayed against new code. A `replay-tested` comment documents that the developer ran replay tests before merging, serving as an auditable gate for versioning changes. Without this verification step, a seemingly safe `patched()` change can silently break thousands of in-flight workflow executions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
patched('feature');
```

### Correct

```ts
// replay-tested: 2025-02-02
patched('feature');
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
