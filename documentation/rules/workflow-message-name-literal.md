# workflow-message-name-literal

## What it does

Require literal string names in `defineSignal()`, `defineQuery()`, and `defineUpdate()` calls. Dynamic names can cause issues with workflow versioning and tooling.

## Why it matters

Signal, query, and update names are part of your workflow's public API. Literals (or stable constants) prevent accidental renames that break clients. If a name is computed dynamically, it may change between deployments, causing existing clients or other workflows that send signals or queries by name to silently fail. Temporal tooling such as the Web UI and CLI also relies on static message names for discoverability and debugging.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
let signalName = 'my-signal';
const mySignal = defineSignal(signalName);
```

### Correct

```ts
const mySignal = defineSignal('my-signal');
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
