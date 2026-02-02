# client-require-workflow-id

## What it does

Require explicit `workflowId` when starting workflows to ensure idempotency.

## Why it matters

The `workflowId` is the primary mechanism for idempotency and de-duplication in Temporal. Without an explicit ID, the SDK generates a random UUID, which means retrying the same client call (e.g., due to a network error) will start a duplicate workflow instead of attaching to the existing one. Explicit, deterministic workflow IDs (e.g., derived from a business entity like `order-${orderId}`) prevent duplicate executions and make it possible to interact with workflows by their known identity.

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
