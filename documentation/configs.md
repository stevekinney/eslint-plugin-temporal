# Configurations

The plugin exports several flat-config presets under `temporal.configs`.

## `recommended`

Use this for most projects. It enables all rules and relies on auto-detection (imports first, file patterns as fallback) to decide which rules apply per file.

```js
import temporal from 'eslint-plugin-temporal';

export default [temporal.configs.recommended];
```

## `workflow`

Strict determinism rules for workflow files. Use this when you prefer explicit file globs.

```js
import temporal from 'eslint-plugin-temporal';

export default [
  {
    files: ['src/workflows/**/*.ts'],
    ...temporal.configs.workflow,
  },
];
```

## `activity`

Rules for activity files (retry hygiene, heartbeat guidance, cancellation signals).

```js
import temporal from 'eslint-plugin-temporal';

export default [
  {
    files: ['src/activities/**/*.ts'],
    ...temporal.configs.activity,
  },
];
```

## `worker`

Rules for worker bootstrap and bundler configuration.

```js
import temporal from 'eslint-plugin-temporal';

export default [
  {
    files: ['src/worker/**/*.ts'],
    ...temporal.configs.worker,
  },
];
```

## `client`

Rules for client code (workflow start safety).

```js
import temporal from 'eslint-plugin-temporal';

export default [
  {
    files: ['src/client/**/*.ts'],
    ...temporal.configs.client,
  },
];
```

## `strict`

All rules enabled as errors. Use this if you want the highest enforcement level across all Temporal code.

```js
import temporal from 'eslint-plugin-temporal';

export default [temporal.configs.strict];
```
