# task-queue-constant

## What it does

Suggest using a constant for task queue names to ensure consistency.

## Why it matters

Task queue names are string identifiers shared between workers and clients -- a typo in either location silently causes workflows to never be picked up, with no error at startup. Using a shared constant (e.g., `TASK_QUEUE`) ensures the name is defined in one place, so the TypeScript compiler catches mismatches at build time. This also makes renaming a task queue a single-line change rather than a risky find-and-replace across the codebase.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
client.workflow.start(myWorkflow, { taskQueue: 'my-queue' });
```

### Correct

```ts
client.workflow.start(myWorkflow, { taskQueue: TASK_QUEUE });
```

## When to disable

Disable only if you have a documented exception for this rule in shared code.
