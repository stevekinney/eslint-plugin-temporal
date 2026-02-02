# worker-ignoremodules-requires-comment

## What it does

Require a comment explaining why modules are being ignored in bundlerOptions.

## Why it matters

Ignoring modules affects workflow bundling and can hide nondeterminism. A comment makes the safety trade-off explicit.

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
