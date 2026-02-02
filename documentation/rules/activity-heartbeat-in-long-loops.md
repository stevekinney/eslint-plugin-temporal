# activity-heartbeat-in-long-loops

## What it does

Suggest calling `heartbeat()` in loops that contain `await` expressions.

## Why it matters

Calling `heartbeat()` inside long-running loops serves two purposes: it reports progress to the Temporal server and it allows the activity to detect cancellation promptly. Without heartbeats, a cancelled activity will continue executing its loop until completion, wasting compute resources and potentially producing unwanted side effects. Temporal uses the `heartbeatTimeout` on the workflow side to detect stalled activities, so missing heartbeats can also cause the server to consider the activity failed and trigger unnecessary retries.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
for (const item of items) {
  await processItem(item);
}
```

### Correct

```ts
for (const item of items) {
  await processItem(item);
  heartbeat();
}
```

## When to disable

Disable only if you have a documented exception for this rule in activity code.
