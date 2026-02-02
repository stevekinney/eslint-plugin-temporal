# task-queue-constant

## What it does

Suggest using a constant for task queue names to ensure consistency.

## Why it matters

Task queue names are shared across workers and clients. Constants prevent typos and make refactors safe.

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
