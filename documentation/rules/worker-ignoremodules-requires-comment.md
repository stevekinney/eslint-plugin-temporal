# worker-ignoremodules-requires-comment

## What it does

Require a comment explaining why modules are being ignored in `bundlerOptions`.

## Why it matters

The `ignoreModules` option in `bundlerOptions` tells the Temporal workflow bundler to skip certain modules, which means any code depending on them will fail silently or throw at runtime inside the workflow sandbox. Without a comment explaining why each module is ignored, future developers may not understand the trade-off and could accidentally introduce nondeterministic dependencies. A comment makes the safety rationale explicit and serves as documentation for code review.

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
