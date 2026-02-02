# activity-use-cancellation-signal

## What it does

Suggest passing cancellation signal to HTTP clients in activities.

## Why it matters

Passing cancellation signals lets HTTP clients abort work promptly, saving resources and preventing wasted retries.

## Options

- httpClients

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
