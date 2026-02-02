# workflow-signal-handler-returns-void

## What it does

Signal handlers must return void. Return values from signal handlers are ignored.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that signal handlers must return void. Return values from signal handlers are ignored.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const mySignal = defineSignal('my-signal');
setHandler(mySignal, (data) => {
  workflowState = data;
  return { updated: true };
});
```

### Correct

```ts
const mySignal = defineSignal('my-signal');
setHandler(mySignal, (data) => {
  workflowState = data;
});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
