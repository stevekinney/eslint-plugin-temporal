# Settings

The plugin supports a `settings.temporal` block for auto-detection and rule customization. These settings are read by context detection and a small set of rules.

## Example

```js
import temporal from 'eslint-plugin-temporal';

export default [
  temporal.configs.recommended,
  {
    settings: {
      temporal: {
        filePatterns: {
          workflow: ['**/temporal/workflows/**'],
          activity: ['**/temporal/activities/**'],
        },
        workflow: {
          denyImports: ['some-unsafe-lib'],
          allowImports: ['lodash'],
          activityDirectories: ['**/temporal/activities/**'],
        },
        activity: {
          httpClients: ['fetch', 'axios', 'customFetch'],
        },
      },
    },
  },
];
```

## `filePatterns`

Customize auto-detection when your directory layout does not match the defaults.

- `workflow`: Array of globs that identify workflow files.
- `activity`: Array of globs that identify activity files.
- `worker`: Array of globs that identify worker files.
- `client`: Array of globs that identify client files.
- `test`: Array of globs that identify test files.

Default patterns are defined in `src/types.ts` (`DEFAULT_FILE_PATTERNS`).

## `workflow`

Workflow-specific settings.

- `denyImports`: Additional package names to disallow in workflows.
- `allowImports`: Package names to allow even if the default denylist would block them.
- `activityDirectories`: Globs used to detect activity folders when resolving imports.

These settings are currently used by rules like `workflow-no-unsafe-package-imports` and by file detection helpers.

## `activity`

Activity-specific settings.

- `httpClients`: Function or identifier names that should receive a cancellation signal in activities (used by `activity-use-cancellation-signal`).
- `idempotencyKeyApis`: Reserved for future rules that enforce idempotency keys in high-risk activities.

## `taskQueuePattern`

Reserved for future rules that validate task queue naming conventions. This setting is not currently enforced.
