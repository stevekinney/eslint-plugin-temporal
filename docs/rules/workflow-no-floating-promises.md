# workflow-no-floating-promises

## What it does

Disallow floating (unhandled) promises in workflows, especially for activity and child workflow calls.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow floating (unhandled) promises in workflows, especially for activity and child workflow calls.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
activities.sendEmail();
```

### Correct

```ts
await activities.sendEmail();
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
