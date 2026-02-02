# workflow-no-floating-promises

## What it does

Disallow floating (unhandled) promises in workflows, especially for activity and child workflow calls.

## Why it matters

A floating promise means the workflow proceeds without waiting for an activity or child workflow to complete, which can cause work to be lost if the workflow finishes or fails before the promise resolves. During replay, Temporal re-executes the workflow code and expects commands to be issued in the same deterministic order; unhandled promises introduce ordering ambiguity that can trigger non-determinism errors. Always `await` promises or collect them with `Promise.all()` to ensure predictable execution and proper error propagation.

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
