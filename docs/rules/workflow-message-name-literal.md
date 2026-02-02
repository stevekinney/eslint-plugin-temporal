# workflow-message-name-literal

## What it does

Require literal string names in defineSignal, defineQuery, and defineUpdate calls. Dynamic names can cause issues with workflow versioning and tooling.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that require literal string names in defineSignal, defineQuery, and defineUpdate calls. Dynamic names can cause issues with workflow versioning and tooling.

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
