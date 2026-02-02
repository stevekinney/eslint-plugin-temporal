# TASKS

## Core correctness and auto-detection

- [x] Apply context-aware wrappers (createContextRule/createWorkflowRule/etc.) to all workflow, activity, worker, and client rules so the recommended config truly auto-detects by imports and file path.
- [x] Add tests that prove auto-detection works for each context (imports win, file path fallback, test context) and for custom settings.
- [x] Align rule `name` fields with exported rule keys (e.g., `workflow-no-console`) so docs URLs and rule identity match.
- [x] Fix docs base URL in rule creators to point at this repo and the actual docs location.
- [x] Add plugin `meta.namespace: 'temporal'` and derive `meta.version` from package.json at build time.

## Documentation and DX

- [x] Create `docs/rules/*.md` for every rule with: what it does, why it matters, options, examples (bad/good), autofix notes, and when to disable.
- [x] Add `docs/settings.md` covering `settings.temporal` (deny/allow imports, file patterns, activityDirectories, httpClients, idempotencyKeyApis, taskQueuePattern).
- [x] Add `docs/configs.md` for `recommended`, `workflow`, `activity`, `worker`, `client`, and `strict` with intended use and example file globs.
- [x] Update `README.md` to link to rule docs/settings, clarify auto-detection behavior, and document overrides.
- [x] Add a docs consistency check (e.g., script that verifies every rule has a doc file and README table is in sync).

## Linting the linter

- [x] Enable `eslint-plugin-eslint-plugin` rules in `eslint.config.js` to validate rule metadata, schemas, docs, and fixers.
- [x] Consider adding `eslint-plugin-n` or similar to validate Node/bundler usage in the plugin codebase.

## Testing and quality

- [x] Expand each rule test to include false positives and option variations; ensure every fixable rule has fix output tests.
- [x] Add integration tests for `configs.recommended` to validate context gating end-to-end.
- [x] Add performance guardrails (e.g., large-file fixture) to keep rules fast and deterministic.

## Rule backlog (missing high-value rules)

### Workflow sandbox and determinism

- [x] no-top-level-workflow-side-effects
- [x] no-mixed-scope-exports
- [x] no-network-in-workflow
- [x] no-fs-in-workflow (or expand the unsafe-package logic to cover this explicitly)
- [x] no-nondeterministic-control-flow (time/randomness used for branching without annotation)
- [x] no-uuid-library-in-workflow (explicit rule or expand denylist)
- [x] uuid4-requires-security-comment
- [x] no-heavy-cpu-in-workflow
- [x] no-logger-library-in-workflow (explicit rule or expand denylist)

### Timers and time

- [x] condition-timeout-style
- [x] duration-format (ms number vs string)
- [x] no-date-now-tight-loop
- [x] no-wall-clock-assumptions

### Activity invocation and retry hygiene

- [x] activity-timeout-duration-format
- [x] no-retry-for-nonidempotent-activities
- [x] require-idempotency-key-arg
- [x] prefer-single-object-activity-args
- [x] prefer-single-object-workflow-args
- [x] no-large-literal-activity-payloads

### Handlers (signals, queries, updates)

- [x] require-message-definitions-at-module-scope
- [x] no-await-in-handler-without-exit-guard
- [x] require-handler-serialization-safe-types

### Cancellation and scopes

- [x] prefer-CancellationScope-withTimeout
- [x] no-settimeout-in-cancellation-scope
- [x] no-swallow-cancellation
- [x] nonCancellable-cleanup-required
- [x] await-cancelRequested-in-nonCancellable-pattern

### Versioning and deployment safety

- [x] patched-must-guard-incompatible-change
- [x] require-deprecatePatch-after-branch-removal
- [x] no-continueAsNew-without-state-argument
- [x] replay-testing-required-comment

### Sinks and observability

- [x] sink-args-must-be-cloneable
- [x] require-callDuringReplay-explicit
- [x] search-attributes-upsert-shape
- [x] no-frequent-search-attribute-upserts

### Serialization and payload hygiene

- [x] no-nonserializable-types-in-payloads
- [x] no-error-as-payload
- [x] no-bigint-in-payload
- [x] no-date-object-in-payload
- [x] require-explicit-payload-types
- [x] no-any-in-workflow-public-api
- [x] no-large-inline-constants

### Testing and replay safety

- [ ] test-teardown-required
- [ ] test-worker-runUntil-required
- [ ] test-import-type-for-activities
- [ ] no-assert-in-production-workflow
- [ ] replay-history-smoke-test-hook

### Local activities and side-effect patterns

- [ ] prefer-local-activity-for-nondeterministic-value
- [ ] no-workflow-prng-for-persisted-ids
- [ ] local-activity-options-required

## Release and CI (npm publishing)

- [ ] Migrate npm publish workflow to trusted publishing (OIDC), remove NPM_TOKEN, ensure npm >= 11.5.1 and provenance enabled.
- [ ] Add `publishConfig.access` and document the tag-driven release flow in `README.md`.
- [ ] Add CI matrix coverage for Node/Bun and key ESLint/TypeScript versions; add `npm pack --dry-run` to verify publish contents.

## Examples and adoption

- [ ] Add `examples/` or fixtures for workflow/activity/worker/client showing typical violations and fixes.
- [ ] Add a short "getting started" + "migration" guide for teams adopting the plugin.
