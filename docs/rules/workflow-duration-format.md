# workflow-duration-format

## What it does

Enforce a consistent duration literal format (string vs millisecond number) for workflow timers.

## Why it matters

Mixing duration formats makes timers harder to read and audit. A consistent style reduces mistakes when reasoning about timeouts.

## Options

See the rule schema in the source for supported options.

## Autofix

No.

## Examples

### Incorrect

```ts
import { sleep } from '@temporalio/workflow';
await sleep(5000);
```

### Correct

```ts
import { sleep, condition, CancellationScope } from '@temporalio/workflow';
await sleep(5000);
await condition(() => ready, 1000);
await CancellationScope.withTimeout(2500, async () => {});
```

## When to disable

Disable only if you have a documented exception for this rule in workflow code.
