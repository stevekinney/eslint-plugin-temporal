# workflow-condition-timeout-style

## What it does

Enforce a consistent timeout style for condition() calls (always include or always omit).

## Why it matters

Consistent condition() timeout usage prevents accidental infinite waits and keeps workflow timing behavior reviewable.

## Options

See the rule schema in the source for supported options.

## Autofix

No.

## Examples

### Incorrect

```ts
import { condition } from '@temporalio/workflow';
await condition(() => ready);
```

### Correct

```ts
import { condition } from '@temporalio/workflow';
await condition(() => ready);
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
