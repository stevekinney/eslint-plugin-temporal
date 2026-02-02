# workflow-replay-testing-required-comment

## What it does

Require a replay-tested comment when workflow versioning logic is changed.

## Why it matters

Replay testing catches nondeterminism. A replay-tested comment documents that verification for versioning changes.

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
