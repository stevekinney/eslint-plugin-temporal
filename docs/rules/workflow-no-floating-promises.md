# workflow-no-floating-promises

## What it does

Disallow floating (unhandled) promises in workflows, especially for activity and child workflow calls.

## Why it matters

Unhandled promises can lead to lost work or nondeterministic ordering. Workflows should await or explicitly manage all async work.

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
