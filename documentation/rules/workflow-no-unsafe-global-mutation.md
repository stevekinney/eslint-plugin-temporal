# workflow-no-unsafe-global-mutation

## What it does

Disallow mutations to `globalThis` or built-in prototypes in workflows. Such mutations are nondeterministic and break workflow replay.

## Why it matters

Temporal's sandbox isolates workflow code, but mutations to `globalThis` or built-in prototypes (e.g., `Array.prototype`, `Object.prototype`) leak state between workflow executions sharing the same isolate. During replay, the order and presence of these mutations may differ, causing divergent behavior and nondeterminism errors. Keeping global state immutable ensures each workflow execution is self-contained and replays identically.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
globalThis.foo = 'bar';
```

### Correct

```ts
const foo = 'bar';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
