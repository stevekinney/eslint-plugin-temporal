# workflow-deprecate-patch-requires-comment

## What it does

Require a comment explaining why deprecatePatch is safe to call. Premature deprecation can break old workflow executions.

## Why it matters

Patch lifecycles are version-sensitive. A comment documents why a patch can be deprecated so future maintainers do not remove it prematurely and break replay compatibility.

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
