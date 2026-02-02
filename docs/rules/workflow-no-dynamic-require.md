# workflow-no-dynamic-require

## What it does

Disallow require() calls in workflows. require() is not deterministic because it can load different modules based on runtime conditions.

## Why it matters

Dynamic require() breaks bundling assumptions and can introduce nondeterministic module loading during replay.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const mod = require('some-module');
```

### Correct

```ts
import { something } from 'some-module';
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
