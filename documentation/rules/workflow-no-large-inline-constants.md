# workflow-no-large-inline-constants

## What it does

Warn on large inline array/object/string constants in workflow files to reduce bundle size and memory usage.

## Why it matters

Temporal bundles workflow code into a sandboxed isolate, and large inline literals increase both the bundle size and the per-workflow memory footprint. Because every workflow execution loads this bundle, oversized constants multiply across concurrent workflows and can exhaust worker memory. Move large constants to a separate module or into activities to keep the workflow bundle lean and replay fast.

## Options

- `maxArrayElements`
- `maxObjectProperties`
- `maxStringLength`

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
