# workflow-deprecate-patch-requires-comment

## What it does

Require a comment explaining why deprecatePatch is safe to call. Premature deprecation can break old workflow executions.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that require a comment explaining why deprecatePatch is safe to call. Premature deprecation can break old workflow executions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
deprecatePatch('feature-v1');
```

### Correct

```ts
// Safe to deprecate: all v1 workflows completed as of 2024-01-01
deprecatePatch('feature-v1');
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
