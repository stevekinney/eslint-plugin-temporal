# workflow-no-dynamic-import

## What it does

Disallow dynamic `import()` expressions in workflow files. Dynamic imports break bundling and are non-deterministic.

## Why it matters

Temporal workflow code is bundled into a deterministic sandbox at build time, and dynamic `import()` expressions bypass this bundling step. At runtime, a dynamic import may resolve to a different module version or fail entirely depending on the environment, producing different behavior during replay than during the original execution. This breaks Temporal's determinism guarantee and can cause non-determinism errors or workflow task failures.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const module = await import('./module');
```

### Correct

```ts
import { foo } from './foo';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
