# workflow-update-handler-return-type

## What it does

Require explicit return type annotations on update handlers. Update handlers return values to the caller and should have explicit types for API clarity.

## Why it matters

Update handlers are part of your workflow's public API -- the return value is serialized and sent back to the caller. Without an explicit return type annotation, a refactor could silently change the serialized shape of the response, breaking clients that depend on it. Declaring the return type also ensures the value is serialization-safe, since TypeScript will flag types like `Date` or `Map` that do not round-trip through Temporal's payload codec.

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
