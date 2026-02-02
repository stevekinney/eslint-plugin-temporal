# activity-heartbeat-in-long-loops

## What it does

Suggest calling heartbeat() in loops that contain await expressions.

## Why it matters

Activity code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that suggest calling heartbeat() in loops that contain await expressions.

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
