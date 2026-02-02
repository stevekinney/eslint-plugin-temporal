# workflow-no-unsafe-package-imports

## What it does

Disallow importing packages that are unsafe for workflow determinism.

## Why it matters

Many packages perform I/O or use nondeterministic sources. Keeping workflow dependencies safe prevents replay failures.

## Options

- denyImports
- allowImports

## Autofix

No.

## Examples

### Incorrect

```ts
import { v4 } from 'uuid';
```

### Correct

```ts
import _ from 'lodash';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
