# workflow-patched-must-guard-incompatible-change

## What it does

Require patched() to be used in a conditional guard to protect incompatible workflow changes.

## Why it matters

patched() should guard incompatible code paths so replay behavior is explicit and safe during version transitions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
patched('feature-v2');
newBehavior();
```

### Correct

```ts
if (patched('feature-v2')) {
  newBehavior();
} else {
  oldBehavior();
}
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
