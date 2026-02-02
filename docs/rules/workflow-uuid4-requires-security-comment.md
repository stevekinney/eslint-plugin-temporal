# workflow-uuid4-requires-security-comment

## What it does

Require a comment noting that uuid4() is deterministic and not cryptographically secure.

## Why it matters

uuid4() is deterministic and not cryptographically secure. A comment helps prevent accidental misuse for security tokens.

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
