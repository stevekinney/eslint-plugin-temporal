# workflow-no-shared-array-buffer

## What it does

Disallow `SharedArrayBuffer` and `Atomics` usage in workflows.

## Why it matters

Shared memory between threads is non-deterministic — replay cannot guarantee the same interleaving of concurrent operations. `SharedArrayBuffer` allows multiple threads to read and write the same memory, and `Atomics` provides synchronization primitives for that shared memory. Both depend on thread scheduling, which varies between executions and breaks Temporal's deterministic replay model.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
const buffer = new SharedArrayBuffer(1024);
```

```ts
Atomics.wait(buffer, 0, 0);
```

### Correct

```ts
const buffer = new ArrayBuffer(1024);
```

## When to disable

Disable if your workflow code intentionally relies on this behavior and you have documented the determinism or operational trade-offs.
