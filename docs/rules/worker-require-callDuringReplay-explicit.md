# worker-require-callDuringReplay-explicit

## What it does

Require explicit callDuringReplay configuration for each sink function.

## Why it matters

callDuringReplay controls whether sinks run during replay. Making it explicit prevents accidental double-logging or missing events.

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
