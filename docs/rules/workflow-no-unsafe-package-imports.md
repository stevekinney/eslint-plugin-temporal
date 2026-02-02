# workflow-no-unsafe-package-imports

## What it does

Disallow importing packages that are unsafe for workflow determinism.

## Why it matters

Workflow code has specific constraints around determinism, replay safety, and runtime boundaries. This rule enforces that disallow importing packages that are unsafe for workflow determinism.

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
