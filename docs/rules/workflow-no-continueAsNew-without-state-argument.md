# workflow-no-continueAsNew-without-state-argument

## What it does

Require continueAsNew() to receive workflow state arguments so state is preserved across runs.

## Why it matters

continueAsNew starts a new run with fresh inputs. Passing state forward prevents accidental resets and replay issues.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
continueAsNew();
```

### Correct

```ts
continueAsNew(state);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
