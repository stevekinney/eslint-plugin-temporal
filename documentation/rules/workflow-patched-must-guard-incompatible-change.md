# workflow-patched-must-guard-incompatible-change

## What it does

Require `patched()` to be used in a conditional guard to protect incompatible workflow changes.

## Why it matters

`patched()` tells the Temporal runtime whether a workflow execution was started before or after a code change. If `patched()` is called without a conditional guard, both old and new code paths execute unconditionally, defeating the purpose of versioning. At runtime this leads to nondeterminism errors during replay because the command sequence no longer matches the recorded history. Wrapping `patched()` in an `if`/`else` ensures that each replay takes exactly the code path that matches its original execution.

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
