# worker-require-call-during-replay-explicit

## What it does

Require explicit `callDuringReplay` configuration for each sink function.

## Why it matters

The `callDuringReplay` property controls whether a sink function executes during workflow replay. If omitted, the default behavior may cause side effects (such as logging, metrics emission, or external API calls) to fire again every time a workflow replays, leading to duplicate log entries, inflated metrics, or unintended external calls. Making this property explicit forces developers to consciously decide whether each sink should be active during replay, preventing subtle production bugs.

## Options

None.

## Autofix

No.

## Examples

### Incorrect

```ts
Worker.create({
  sinks: {
    logger: {
      info: {
        fn: () => {},
      },
    },
  },
});
```

### Correct

```ts
Worker.create({
  sinks: {
    logger: {
      info: {
        fn: (info, message) => {
          console.log(message);
        },
        callDuringReplay: false,
      },
    },
  },
});
```

## When to disable

Disable if the requirement is enforced elsewhere (code review, wrappers) or you intentionally rely on defaults.
