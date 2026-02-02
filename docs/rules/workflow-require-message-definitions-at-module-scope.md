# workflow-require-message-definitions-at-module-scope

## What it does

Require defineSignal/defineQuery/defineUpdate calls to be declared at module scope so handler definitions remain stable across workflow runs.

## Why it matters

Defining messages at module scope keeps handler identities stable and avoids redefining them on every workflow activation.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
export async function myWorkflow() {
  const sig = defineSignal('sig');
  setHandler(sig, () => {});
}
```

### Correct

```ts
const mySignal = defineSignal('mySignal');
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
