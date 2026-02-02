# workflow-no-unsafe-package-imports

## What it does

Disallow importing packages that are unsafe for workflow determinism.

## Why it matters

Many npm packages internally perform I/O, read environment variables, use `Math.random()`, or depend on Node.js built-ins -- all of which violate the determinism requirements of the Temporal workflow sandbox. If such a package is imported into a workflow file, its side effects can cause nondeterminism errors during replay or outright runtime failures when the sandbox cannot resolve the underlying APIs. This rule maintains an allow/deny list so teams can audit and control which dependencies enter workflow code.

## Options

- `denyImports`
- `allowImports`

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
