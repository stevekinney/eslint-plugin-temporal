# test-import-type-for-activities

## What it does

Require type-only imports for activity modules in tests to avoid loading implementations when building mocks.

## Why it matters

Using type-only activity imports in tests keeps mocks lightweight and avoids loading real implementations.

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
