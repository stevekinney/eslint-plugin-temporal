# workflow-no-crypto-random

## What it does

Disallow `crypto.randomBytes()`, `crypto.getRandomValues()`, and `crypto.randomFillSync()` in workflows.

## Why it matters

These methods produce non-deterministic random output that will differ on replay. While `crypto.randomUUID()` has its own dedicated rule with an autofix to `uuid4()`, the other crypto random APIs can slip through if `crypto` is accessed as a global or aliased. Move random byte generation to an activity if you need it.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const bytes = crypto.randomBytes(16);
```

```ts
crypto.getRandomValues(new Uint8Array(32));
```

```ts
crypto.randomFillSync(buffer);
```

### Correct

```ts
// Move random generation to an activity
const bytes = await randomBytesActivity(16);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
