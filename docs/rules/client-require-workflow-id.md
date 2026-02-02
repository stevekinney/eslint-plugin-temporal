# client-require-workflow-id

## What it does

Require explicit workflowId when starting workflows to ensure idempotency.

## Why it matters

Workflow IDs provide idempotency and de-duplication. Omitting them can create duplicate workflows on retries.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
client.workflow.start(myWorkflow, { taskQueue: 'main' });
```

### Correct

```ts
client.workflow.start(myWorkflow, { workflowId: 'order-123' });
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
