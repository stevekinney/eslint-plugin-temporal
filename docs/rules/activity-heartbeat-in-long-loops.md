# activity-heartbeat-in-long-loops

## What it does

Suggest calling heartbeat() in loops that contain await expressions.

## Why it matters

Heartbeats allow cancellation and progress reporting. Long loops without heartbeats can run indefinitely after cancellation.

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
