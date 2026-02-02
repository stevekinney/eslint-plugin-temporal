# workflow-update-handler-return-type

## What it does

Require explicit return type annotations on update handlers. Update handlers return values to the caller and should have explicit types for API clarity.

## Why it matters

Update handlers are part of your workflow API. Explicit return types prevent accidental breaking changes.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const myUpdate = defineUpdate('myUpdate');
setHandler(myUpdate, (value) => {
  state = value;
  return state;
});
```

### Correct

```ts
const myUpdate = defineUpdate('myUpdate');
setHandler(myUpdate, (value: string): string => {
  state = value;
  return state;
});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
