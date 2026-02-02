# workflow-require-type-only-activity-imports

## What it does

Require type-only imports for activity modules. Non-type imports pull non-deterministic code into the workflow bundle.

## Why it matters

Type-only imports keep activity implementations out of the workflow bundle, preserving sandbox safety.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
import { Activities } from './activities';
```

### Correct

```ts
import type { Activities } from './activities';
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
