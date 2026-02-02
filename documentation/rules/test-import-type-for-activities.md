# test-import-type-for-activities

## What it does

Require type-only imports for activity modules in tests to avoid loading implementations when building mocks.

## Why it matters

Using `import type` for activity modules in tests ensures that only the TypeScript type information is loaded, not the actual activity implementations. Loading real implementations pulls in their dependencies (database clients, HTTP libraries, etc.), which can cause test failures, slow down the test suite, and defeat the purpose of mocking. Temporal test patterns rely on registering mock activity implementations with the test worker, so the real code should never be imported at runtime in test files.

## Options

None.

## Autofix

Yes (fixable: code).

## Examples

### Incorrect

```ts
import * as activities from '../activities';
```

### Correct

```ts
import type * as activities from '../activities';
const mocks: typeof activities = {};
```

## When to disable

Disable only if you have a documented exception for this rule in test code.
