# activity-use-cancellation-signal

## What it does

Suggest passing a cancellation signal to HTTP clients in activities.

## Why it matters

When Temporal cancels an activity, the SDK sets its `CancellationScope` signal, but in-flight HTTP requests will continue to completion unless you explicitly pass a cancellation signal (e.g., `AbortSignal`) to the HTTP client. Without it, cancelled activities waste network and compute resources waiting for responses that will be discarded. Propagating the signal ensures that `fetch`, `axios`, and other HTTP clients abort promptly, freeing resources and allowing the worker to pick up new tasks faster.

## Options

- `httpClients`

## Autofix

No.

## Examples

### Incorrect

```ts
fetch(url);
```

### Correct

```ts
customFetch(url, { signal: cancellationSignal });
```

## When to disable

Disable only if you have a documented exception for this rule in activity code.
