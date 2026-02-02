# task-queue-constant

## What it does

Suggest using a constant for task queue names to ensure consistency.

## Why it matters

Shared code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that suggest using a constant for task queue names to ensure consistency.

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
