# workflow-uuid4-requires-security-comment

## What it does

Require a comment noting that `uuid4()` is deterministic and not cryptographically secure.

## Why it matters

Temporal's `uuid4()` uses a deterministic PRNG seeded by the workflow's replay state so that it produces the same value on every replay. This means the output is predictable and must never be used for security-sensitive purposes such as authentication tokens, API keys, or session identifiers. Requiring an explicit comment forces developers to acknowledge this limitation at the call site, reducing the risk of accidental misuse.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
import { uuid4 } from '@temporalio/workflow';
const id = uuid4();
```

### Correct

```ts
import { uuid4 } from '@temporalio/workflow';
// uuid4 is deterministic and not secure
const id = uuid4();
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
