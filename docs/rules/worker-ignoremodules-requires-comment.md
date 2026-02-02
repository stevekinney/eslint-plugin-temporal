# worker-ignoremodules-requires-comment

## What it does

Require a comment explaining why modules are being ignored in bundlerOptions.

## Why it matters

Worker code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that require a comment explaining why modules are being ignored in bundlerOptions.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
Worker.create({
  bundlerOptions: {
    ignoreModules: ['pg', 'redis'],
  },
});
```

### Correct

```ts
Worker.create({
  bundlerOptions: {
    // These modules are server-only and not used in workflows
    ignoreModules: ['pg', 'redis'],
  },
});
```

## When to disable

Disable only if you have a documented exception for this rule in worker code.
