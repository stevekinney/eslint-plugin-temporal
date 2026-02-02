# workflow-require-type-only-activity-imports

## What it does

Require type-only imports for activity modules. Non-type imports pull non-deterministic code into the workflow bundle.

## Why it matters

Type-only imports keep activity implementations out of the workflow bundle, preserving sandbox safety. If an activity module is imported with a regular `import` statement, its full implementation -- including Node.js built-ins, network calls, and file-system access -- gets bundled into the deterministic workflow sandbox, which can break replay determinism. Using `import type` ensures that only the TypeScript type information is retained for use with `proxyActivities()`, while the actual execution happens outside the sandbox in an activity worker.

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
