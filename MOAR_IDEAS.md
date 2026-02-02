Assumptions and scope

I’m assuming “Temporal” here means the workflow orchestration engine and you’re linting code written against the Temporal TypeScript SDK—so you’ve got Workflow code running in the deterministic sandbox, Activities running in the normal runtime, and Worker/Client code wiring it all together.

That environment split is the source of most lintable footguns: Workflow code is bundled and executed in a sandbox that can’t do I/O and can’t safely touch Node or DOM APIs; Activities are where side effects live; and Workflows can’t import Activity implementations directly (types are fine). The SDK also replaces some common globals (like Date, Math.random, setTimeout) with deterministic versions, which is convenient but can surprise you if you assume “real world time” semantics. ￼

On top of that, message handlers (Signals, Queries, Updates) have very specific constraints—for example, Query handlers can’t be async and must not mutate state, and Continue‑As‑New has special caveats with Updates/handlers. ￼

Rule namespace and how to scope rules

A practical approach is to make an ESLint plugin with a temporal/\* namespace and have every rule operate in one of these scopes:

Workflow scope—files that import @temporalio/workflow (or match a workflows/** glob).
Activity scope—files that import @temporalio/activity (or match activities/**).
Worker scope—files that import @temporalio/worker.
Client scope—files that import @temporalio/client.
Test scope—_.test._, **tests**/\*\*, etc.

Almost every rule becomes easier (and less noisy) if it first answers “what kind of file is this?”

Project boundaries and file hygiene rules

temporal/no-workflow-and-activity-in-same-file — forbid importing both @temporalio/workflow and @temporalio/activity in one module (the SDK expects them in separate environments). ￼

temporal/no-client-in-workflow — forbid @temporalio/client imports in Workflow files (Workflows shouldn’t use a Client directly; use Workflow APIs like external handles and child workflows). ￼

temporal/no-worker-in-workflow — forbid @temporalio/worker imports in Workflow files.

temporal/no-node-builtins-in-workflow — forbid imports of Node built‑ins (fs, http, crypto, child_process, etc.) in Workflow files (sandbox restriction). ￼

temporal/no-dom-globals-in-workflow — forbid window, document, localStorage, XMLHttpRequest, etc. in Workflow files.

temporal/no-process-env-in-workflow — forbid process.env usage in Workflow files (environment‑dependent behavior is a determinism smell even if it “happens to work”).

temporal/no-dynamic-require-in-workflow — forbid require() calls in Workflow files; prefer static imports to keep bundling predictable.

temporal/no-dynamic-import-in-workflow — forbid import() expressions in Workflow files (same rationale).

temporal/no-top-level-workflow-side-effects — forbid top‑level calls that schedule workflow commands (timers, activities, child workflows) outside a Workflow function. Keep module scope to declarations and wiring.

temporal/no-mixed-scope-exports — enforce that Workflow files only export Workflow functions and message definitions (signals/queries/updates), not Workers/Clients.

Workflow sandbox and determinism guardrails

temporal/no-weakref-in-workflow — forbid WeakRef in Workflows. ￼

temporal/no-finalizationregistry-in-workflow — forbid FinalizationRegistry in Workflows. ￼

temporal/no-network-in-workflow — forbid fetch, axios, undici, graphql-request, etc. in Workflow files.

temporal/no-fs-in-workflow — forbid filesystem packages in Workflow files, even “tiny” helpers that might pull in fs transitively.

temporal/no-nondeterministic-deps-in-workflow — project‑configurable denylist/allowlist for Workflow imports (this catches “I only imported constants” but the dependency pulls in non‑sandbox‑safe code). This is directly motivated by real-world failures people hit. ￼

temporal/prefer-ignoreModules-comment — if a Workflow import matches a configured “allowed but requires ignoreModules” list, require a comment explaining why it’s safe and pointing to the Worker bundling config’s ignoreModules. ￼

temporal/no-unsafe-global-mutation — disallow mutating global objects (globalThis, prototypes) in Workflow files.

temporal/no-nondeterministic-control-flow — warn when using randomness/time for branching logic without an explicit “I meant this” annotation. Even though the SDK replaces some globals with deterministic versions, accidental control‑flow dependence is a classic replay headache when code evolves. ￼

temporal/no-crypto-randomuuid-in-workflow — forbid crypto.randomUUID() in Workflow files; suggest uuid4() from @temporalio/workflow or generating IDs in an Activity/local activity depending on your needs. ￼

temporal/no-uuid-library-in-workflow — forbid common UUID libs (uuid, cuid, nanoid, etc.) in Workflow files unless allowlisted.

temporal/uuid4-requires-security-comment — if uuid4() is used, require a comment acknowledging it’s deterministic and cryptographically insecure (so nobody uses it as a security token). ￼

temporal/no-heavy-cpu-in-workflow — heuristic warning for expensive loops, large JSON parsing, crypto hashing, etc. in Workflows (push to Activities).

Timers, waiting, and time rules

temporal/prefer-sleep-over-settimeout — warn on setTimeout in Workflow files; recommend sleep() because setTimeout has known limitations with cancellation scopes. ￼

temporal/prefer-condition-over-polling — detect “poll loops” like while (!flag) { await sleep(…); } and suggest condition(() => flag).

temporal/no-busy-wait — forbid loops that spin without an await (guaranteed Workflow Task pain).

temporal/condition-timeout-style — enforce a consistent timeout style for condition (always provide a timeout in long-running workflows, or always omit in short ones—configurable).

temporal/duration-format — enforce duration literals to be either milliseconds numbers or ms-formatted strings consistently (for example, prefer '10m'/'1 day' everywhere). The API supports both for timers like condition. ￼

temporal/no-date-now-tight-loop — warn when Date.now() is called multiple times in the same synchronous block without yielding—because deterministic Date can surprise you (it won’t advance until timers/Workflow progression). ￼

temporal/no-wall-clock-assumptions — warn when code compares Date.now() to an externally supplied timestamp in a way that implies wall-clock progression inside a single task.

temporal/no-setinterval-in-workflow — forbid setInterval entirely; suggest an explicit loop with sleep or condition.

Activity invocation and options rules

temporal/require-activity-timeout — require startToCloseTimeout (or another appropriate timeout) when creating proxies via proxyActivities. This is basic operational hygiene.

temporal/activity-timeout-duration-format — enforce consistent timeout literal format in proxyActivities options.

temporal/require-activity-retry-policy — enforce an explicit retry policy (even if you choose to mirror defaults) so behavior is reviewable.

temporal/no-retry-for-nonidempotent-activities — allow a config list of Activity name patterns (or a JSDoc tag like @nonIdempotent) that must set retry: { maximumAttempts: 1 }. ￼

temporal/require-idempotency-key-arg — for Activities that likely have side effects (name patterns like charge*, send*, create\*), require an idempotencyKey field in the input object (or require passing workflowId/runId fields).

temporal/prefer-single-object-activity-args — enforce Activities accept one object argument rather than multiple positional args—easier to evolve signatures. ￼

temporal/prefer-single-object-workflow-args — same as above, for Workflow function signatures. ￼

temporal/no-large-literal-activity-payloads — warn when passing large string/array/object literals directly into Activities (payloads are stored in history; huge payloads hurt performance). ￼

temporal/no-activity-definition-import-in-workflow — forbid importing Activity implementations into Workflow files; allow type‑only imports for typing proxies. ￼

temporal/require-type-only-imports-for-activities — if a Workflow imports ./activities, it must be import type. ￼

Local Activities and “SideEffect” style patterns

TypeScript doesn’t implement the classic SideEffect API the way some other SDKs do—local activities are the recommended alternative. ￼

temporal/prefer-local-activity-for-nondeterministic-value — if a Workflow needs a random/UUID that must remain stable across future code refactors, suggest generating it via a local activity instead of consuming the Workflow PRNG directly.

temporal/no-workflow-prng-for-persisted-ids — warn when Math.random() or uuid4() is used to generate IDs that are sent to external systems; suggest local activity or normal activity generation plus returning the value. ￼

temporal/local-activity-options-required — enforce explicit timeouts/retry policy for proxyLocalActivities (if used).

Signals, Queries, and Updates rules

temporal/require-message-definitions-at-module-scope — enforce defineSignal, defineQuery, defineUpdate live at module scope (not inside the Workflow function), matching recommended patterns. ￼

temporal/require-setHandler-early — in a Workflow function, require setHandler(...) calls happen before the first await (so handlers are registered immediately).

temporal/no-async-query-handler — Query handlers passed to setHandler must not be async and must not return a Promise. ￼

temporal/no-query-state-mutation — disallow assignments, updates (++/--), and mutating method calls on captured variables inside Query handlers. ￼

temporal/no-workflow-apis-in-query — disallow calls like proxyActivities, sleep, condition, child workflow APIs, etc. inside Query handlers. ￼

temporal/signal-handler-returns-void — enforce Signal handlers return void or Promise<void> only. ￼

temporal/update-handler-return-type — enforce Update handlers have an explicit return type annotation (so API changes don’t silently widen types).

temporal/no-continueAsNew-in-update-handler — forbid Continue‑As‑New from inside Update handlers; require the main Workflow function to initiate it. ￼

temporal/require-allHandlersFinished-before-exit — if the Workflow registers any Update/Signal handlers, require await condition(allHandlersFinished) before returning or Continue‑As‑New to avoid interrupting in‑flight handlers. ￼

temporal/no-await-in-handler-without-exit-guard — if an Update/Signal handler is async and awaits workflow operations, require the workflow to have an “exit guard” (the allHandlersFinished wait) somewhere.

temporal/message-name-literal — enforce message names passed to define\* are string literals (or constants), not computed strings.

temporal/require-handler-serialization-safe-types — enforce handler args/return values are serializable (or match a configured converter profile). ￼

Cancellation and scopes rules

temporal/prefer-CancellationScope-withTimeout — if code creates a timer just to cancel work after a deadline, suggest CancellationScope.withTimeout.

temporal/no-settimeout-in-cancellation-scope — warn when setTimeout is used where cancellation scopes are in play, given the SDK’s caveat. ￼

temporal/no-swallow-cancellation — if catching cancellation errors, require rethrow unless explicitly handled (configurable allowlist).

temporal/nonCancellable-cleanup-required — if a Workflow catches cancellation and runs cleanup logic, require it to be wrapped in CancellationScope.nonCancellable (pattern from docs/samples). ￼

temporal/await-cancelRequested-in-nonCancellable-pattern — when using nonCancellable, encourage awaiting cancelRequested so the Workflow can react appropriately. ￼

Versioning and safe deployments rules

temporal/patch-id-constant — require patch IDs in patched()/deprecatePatch() are constants (string literal or const) and not constructed.

temporal/no-duplicate-patch-ids — repo‑wide uniqueness check for patch IDs.

temporal/patched-must-guard-incompatible-change — when a diff introduces a new Activity call ordering or removes an old call, require a patch guard (this one is ambitious but possible with patterns like “removed call to activityA, added activityB”).

temporal/require-deprecatePatch-after-branch-removal — if a patch branch disappears but the patch ID is still in use elsewhere, warn.

temporal/no-deprecatePatch-without-comment — require a comment explaining “what version are we in and why is it safe now?” because the lifecycle matters. ￼

temporal/no-continueAsNew-without-state-argument — enforce Continue‑As‑New passes forward the necessary state in args (common correctness issue). ￼

temporal/replay-testing-required-comment — when touching Workflow logic files, require a PR annotation comment like // replay-tested (enforced by lint in code touched areas). This is more process-y, but it works.

Observability, logging, and sinks rules

Workflows shouldn’t use regular loggers because they can’t do I/O and replays would duplicate logs; the SDK provides log in Workflow and Activity contexts. ￼

temporal/no-console-in-workflow — forbid console.\* in Workflow files; suggest log from @temporalio/workflow. ￼

temporal/prefer-activity-context-log — in Activities, prefer log from @temporalio/activity over console (configurable). ￼

temporal/no-logger-library-in-workflow — forbid imports of popular Node loggers in Workflow files.

temporal/no-await-sink-call — forbid awaiting sink calls (they can’t be awaited and don’t return values). ￼

temporal/no-sink-return-value — forbid using sink calls in expressions (no assignments like const x = sink.foo()).

temporal/sink-args-must-be-cloneable — warn when sink args include non‑cloneable types (functions, class instances, Errors, etc.). ￼

temporal/require-callDuringReplay-explicit — when injecting sinks in Worker code, require explicitly setting callDuringReplay to avoid accidental behavior differences.

temporal/search-attributes-upsert-shape — enforce upsertSearchAttributes values are arrays and removal uses [] (not undefined or null). ￼

temporal/no-frequent-search-attribute-upserts — warn on upserts inside tight loops (history bloat).

Serialization and payload hygiene rules

Workflow and handler inputs/outputs must be serializable, and payload size/history size matters for performance. ￼

temporal/no-nonserializable-types-in-payloads — forbid functions, symbols, DOM nodes, streams, etc. in Workflow args, Activity args, and handler args/returns (configurable for custom converters).

temporal/no-error-as-payload — forbid passing Error objects directly; require { name, message, stack? } shaped objects.

temporal/no-bigint-in-payload — forbid bigint in payload types unless a custom converter is configured.

temporal/no-date-object-in-payload — prefer ISO strings (or explicit { epochMs }) rather than Date instances crossing the boundary.

temporal/require-explicit-payload-types — require input/output interfaces for Activities and Workflows, instead of any.

temporal/no-any-in-workflow-public-api — forbid any in exported Workflow function signature and message definitions.

temporal/no-large-inline-constants — warn on huge inline arrays/objects in Workflow files (bundle size and memory).

Testing and replay safety rules

temporal/test-teardown-required — if using TestWorkflowEnvironment, require teardown() in afterAll/afterEach. ￼

temporal/test-worker-runUntil-required — if a test creates a Worker, require it’s bounded via runUntil(...) to avoid hanging.

temporal/test-import-type-for-activities — in Workflow unit tests, enforce import type \* as activities when building mock activity objects. ￼

temporal/no-assert-in-production-workflow — warn on Node assert usage in non-test Workflow code (failed asserts can cause Workflow Task retry loops unless you’re intentionally using them). ￼

temporal/replay-history-smoke-test-hook — enforce a convention file that runs Worker.runReplayHistories() in CI when Workflow code changes (lint can enforce the file exists and exports a function). ￼

Examples and high-value autofix candidates

Enforce type-only Activity imports in Workflows

Bad

import \* as activities from './activities';
import { proxyActivities } from '@temporalio/workflow';

const { chargeCard } = proxyActivities<typeof activities>({
startToCloseTimeout: '1 minute',
});

Good

import type \* as activities from './activities';
import { proxyActivities } from '@temporalio/workflow';

const { chargeCard } = proxyActivities<typeof activities>({
startToCloseTimeout: '1 minute',
});

This directly encodes the “Workflows can’t import Activity implementations, only types” rule. ￼

Prefer sleep over setTimeout in Workflows

Bad

export async function myWorkflow() {
await new Promise((resolve) => setTimeout(resolve, 1_000));
}

Good

import { sleep } from '@temporalio/workflow';

export async function myWorkflow() {
await sleep('1s');
}

The SDK documents sleep as the recommended timer API and calls out caveats around setTimeout and cancellation scopes. ￼

Query handler cannot be async and must not mutate state

Bad

wf.setHandler(getStateQuery, async () => {
state.lastViewedAt = Date.now();
return state;
});

Good

wf.setHandler(getStateQuery, () => {
return state;
});

That’s straight from the handler contract: no async, no mutation, no workflow operations. ￼

Wait for in-flight handlers before returning or continuing as new

Bad

export async function myWorkflow() {
wf.setHandler(mySignal, async () => {
await doSomething();
});

return; // exits while a handler might still be running
}

Good

export async function myWorkflow() {
wf.setHandler(mySignal, async () => {
await doSomething();
});

await wf.condition(wf.allHandlersFinished);
}

The API explicitly provides allHandlersFinished() for this “don’t cut the ground out from under your handlers” scenario. ￼

Patch lifecycle hygiene

Bad

if (wf.patched('change-123')) {
await activityB();
} else {
await activityA();
}

Good

const CHANGE_ID = 'change-123' as const;

if (wf.patched(CHANGE_ID)) {
await activityB();
} else {
await activityA();
}

Then later, when safe, you move to:

wf.deprecatePatch(CHANGE_ID);
await activityB();

This mirrors the documented three-step patching lifecycle. ￼

⸻

That’s a lot of lint, but Temporal is basically “make distributed systems boring by making your code replayable”—so a good lint plugin mostly exists to keep your team from accidentally summoning nondeterminism demons with a single innocent-looking import. ￼
