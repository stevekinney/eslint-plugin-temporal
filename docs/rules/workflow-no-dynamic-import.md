# workflow-no-dynamic-import

## What it does

Disallow dynamic import() expressions in workflow files. Dynamic imports break bundling and are non-deterministic.

## Why it matters

Dynamic imports can bypass bundling guarantees and lead to runtime differences between replays. Keep workflow dependencies static.

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
