# workflow-no-large-inline-constants

## What it does

Warn on large inline array/object/string constants in workflow files to reduce bundle size and memory usage.

## Why it matters

Large inline literals increase workflow bundle size and memory use. Move big constants out of workflow code.

## Options

- maxArrayElements
- maxObjectProperties
- maxStringLength

## Autofix

No.

## Examples

### Incorrect

```ts
const bigArray = [1, 2, 3, 4];
```

### Correct

```ts
const smallArray = [1, 2, 3];
const smallObject = { a: 1, b: 2, c: 3 };
const smallString = 'short';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
