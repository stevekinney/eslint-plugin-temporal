import type { TSESLint } from '@typescript-eslint/utils';

import { contextNotStored } from './activity/context-not-stored.ts';
import { heartbeatInLongLoops } from './activity/heartbeat-in-long-loops.ts';
// Activity rules
import { preferActivityLog } from './activity/prefer-activity-log.ts';
import { preferApplicationFailure } from './activity/prefer-applicationfailure.ts';
import { preferSingleObjectActivityArgs } from './activity/prefer-single-object-args.ts';
import { useCancellationSignal } from './activity/use-cancellation-signal.ts';
// Client rules
import { requireWorkflowId } from './client/require-workflow-id.ts';
import { noTemporalInternalImports } from './shared/no-temporal-internal-imports.ts';
import { noWorkflowAndActivityInSameFile } from './shared/no-workflow-and-activity-in-same-file.ts';
// Shared rules
import { taskQueueConstant } from './shared/task-queue-constant.ts';
import { replayHistorySmokeTestHook } from './test/replay-history-smoke-test-hook.ts';
import { testImportTypeForActivities } from './test/test-import-type-for-activities.ts';
import { testTeardownRequired } from './test/test-teardown-required.ts';
import { testWorkerRunUntilRequired } from './test/test-worker-run-until-required.ts';
import { ignoremodulesRequiresComment } from './worker/ignoremodules-requires-comment.ts';
// Worker rules
import { noWorkflowOrActivityDefinitions } from './worker/no-workflow-or-activity-definitions.ts';
import { requireCallDuringReplayExplicit } from './worker/require-call-during-replay-explicit.ts';
// Workflow rules
import { activityTimeoutDurationFormat } from './workflow/activity-timeout-duration-format.ts';
import { awaitCancelRequestedInNonCancellablePattern } from './workflow/await-cancel-requested-in-non-cancellable-pattern.ts';
import { conditionTimeoutStyle } from './workflow/condition-timeout-style.ts';
import { deprecatePatchRequiresComment } from './workflow/deprecate-patch-requires-comment.ts';
import { durationFormat } from './workflow/duration-format.ts';
import { localActivityOptionsRequired } from './workflow/local-activity-options-required.ts';
import { messageNameLiteral } from './workflow/message-name-literal.ts';
import { noActivityDefinitionsImport } from './workflow/no-activity-definitions-import.ts';
import { noAnyInWorkflowPublicApi } from './workflow/no-any-in-workflow-public-api.ts';
import { noAssertInProductionWorkflow } from './workflow/no-assert-in-production-workflow.ts';
import { noAsyncQueryHandler } from './workflow/no-async-query-handler.ts';
import { noAwaitInHandlerWithoutExitGuard } from './workflow/no-await-in-handler-without-exit-guard.ts';
import { noBigintInPayload } from './workflow/no-bigint-in-payload.ts';
import { noBusyWait } from './workflow/no-busy-wait.ts';
import { noClientImport } from './workflow/no-client-import.ts';
import { noConsole } from './workflow/no-console.ts';
import { noContinueAsNewInUpdateHandler } from './workflow/no-continue-as-new-in-update-handler.ts';
import { noContinueAsNewWithoutStateArgument } from './workflow/no-continue-as-new-without-state-argument.ts';
import { noCryptoRandom } from './workflow/no-crypto-random.ts';
import { noCryptoRandomUuid } from './workflow/no-crypto-random-uuid.ts';
import { noDateNowTightLoop } from './workflow/no-date-now-tight-loop.ts';
import { noDateObjectInPayload } from './workflow/no-date-object-in-payload.ts';
import { noDuplicatePatchIds } from './workflow/no-duplicate-patch-ids.ts';
import { noDynamicImport } from './workflow/no-dynamic-import.ts';
import { noDynamicRequire } from './workflow/no-dynamic-require.ts';
import { noErrorAsPayload } from './workflow/no-error-as-payload.ts';
import { noFinalizationRegistry } from './workflow/no-finalization-registry.ts';
import { noFloatingPromises } from './workflow/no-floating-promises.ts';
import { noFrequentSearchAttributeUpserts } from './workflow/no-frequent-search-attribute-upserts.ts';
import { noFsInWorkflow } from './workflow/no-fs-in-workflow.ts';
import { noHeavyCpuInWorkflow } from './workflow/no-heavy-cpu-in-workflow.ts';
import { noLargeInlineConstants } from './workflow/no-large-inline-constants.ts';
import { noLargeLiteralActivityPayloads } from './workflow/no-large-literal-activity-payloads.ts';
import { noLargeLiteralPayloads } from './workflow/no-large-literal-payloads.ts';
import { noLoggerLibraryInWorkflow } from './workflow/no-logger-library-in-workflow.ts';
import { noMixedScopeExports } from './workflow/no-mixed-scope-exports.ts';
import { noNetworkInWorkflow } from './workflow/no-network-in-workflow.ts';
import { noNodeOrDomImports } from './workflow/no-node-or-dom-imports.ts';
import { noNondeterministicControlFlow } from './workflow/no-nondeterministic-control-flow.ts';
import { noNonserializableTypesInPayloads } from './workflow/no-nonserializable-types-in-payloads.ts';
import { noProcessEnv } from './workflow/no-process-env.ts';
import { noQueryMutation } from './workflow/no-query-mutation.ts';
import { noRetryForNonIdempotentActivities } from './workflow/no-retry-for-nonidempotent-activities.ts';
import { noSetInterval } from './workflow/no-setinterval.ts';
import { noSetTimeoutInCancellationScope } from './workflow/no-settimeout-in-cancellation-scope.ts';
import { noSharedArrayBuffer } from './workflow/no-shared-array-buffer.ts';
import { noSwallowCancellation } from './workflow/no-swallow-cancellation.ts';
import { noThrowRawError } from './workflow/no-throw-raw-error.ts';
import { noTopLevelWorkflowSideEffects } from './workflow/no-top-level-workflow-side-effects.ts';
import { noUnsafeGlobalMutation } from './workflow/no-unsafe-global-mutation.ts';
import { noUnsafePackageImports } from './workflow/no-unsafe-package-imports.ts';
import { noUuidLibraryInWorkflow } from './workflow/no-uuid-library-in-workflow.ts';
import { noWallClockAssumptions } from './workflow/no-wall-clock-assumptions.ts';
import { noWeakRef } from './workflow/no-weakref.ts';
import { noWorkerImport } from './workflow/no-worker-import.ts';
import { noWorkflowApisInQuery } from './workflow/no-workflow-apis-in-query.ts';
import { noWorkflowPrngForPersistedIds } from './workflow/no-workflow-prng-for-persisted-ids.ts';
import { nonCancellableCleanupRequired } from './workflow/non-cancellable-cleanup-required.ts';
import { patchIdLiteral } from './workflow/patch-id-literal.ts';
import { patchedMustGuardIncompatibleChange } from './workflow/patched-must-guard-incompatible-change.ts';
import { preferCancellationScopeWithTimeout } from './workflow/prefer-cancellation-scope-with-timeout.ts';
import { preferConditionOverPolling } from './workflow/prefer-condition-over-polling.ts';
import { preferLocalActivityForNondeterministicValue } from './workflow/prefer-local-activity-for-nondeterministic-value.ts';
import { preferSingleObjectWorkflowArgs } from './workflow/prefer-single-object-workflow-args.ts';
import { preferSleep } from './workflow/prefer-sleep.ts';
import { preferWorkflowUuid } from './workflow/prefer-workflow-uuid.ts';
import { replayTestingRequiredComment } from './workflow/replay-testing-required-comment.ts';
import { requireActivityRetryPolicy } from './workflow/require-activity-retry-policy.ts';
import { requireActivityTimeouts } from './workflow/require-activity-timeouts.ts';
import { requireAllHandlersFinished } from './workflow/require-all-handlers-finished.ts';
import { requireDeprecatePatchAfterBranchRemoval } from './workflow/require-deprecate-patch-after-branch-removal.ts';
import { requireExplicitPayloadTypes } from './workflow/require-explicit-payload-types.ts';
import { requireHandlerSerializationSafeTypes } from './workflow/require-handler-serialization-safe-types.ts';
import { requireIdempotencyKeyArg } from './workflow/require-idempotency-key-arg.ts';
import { requireMessageDefinitionsAtModuleScope } from './workflow/require-message-definitions-at-module-scope.ts';
import { requireSetHandlerEarly } from './workflow/require-set-handler-early.ts';
import { requireTypeOnlyActivityImports } from './workflow/require-type-only-activity-imports.ts';
import { searchAttributesUpsertShape } from './workflow/search-attributes-upsert-shape.ts';
import { signalHandlerReturnsVoid } from './workflow/signal-handler-returns-void.ts';
import { sinkArgsMustBeCloneable } from './workflow/sink-args-must-be-cloneable.ts';
import { sinkNoAwait } from './workflow/sink-no-await.ts';
import { sinkNoReturnValue } from './workflow/sink-no-return-value.ts';
import { updateHandlerReturnType } from './workflow/update-handler-return-type.ts';
import { uuid4RequiresSecurityComment } from './workflow/uuid4-requires-security-comment.ts';

/**
 * All rules exported by the plugin
 */
export const rules = {
  // Workflow rules
  'workflow-activity-timeout-duration-format': activityTimeoutDurationFormat,
  'workflow-await-cancel-requested-in-non-cancellable-pattern':
    awaitCancelRequestedInNonCancellablePattern,
  'workflow-condition-timeout-style': conditionTimeoutStyle,
  'workflow-deprecate-patch-requires-comment': deprecatePatchRequiresComment,
  'workflow-duration-format': durationFormat,
  'workflow-message-name-literal': messageNameLiteral,
  'workflow-no-await-in-handler-without-exit-guard': noAwaitInHandlerWithoutExitGuard,
  'workflow-no-activity-definitions-import': noActivityDefinitionsImport,
  'workflow-no-any-in-workflow-public-api': noAnyInWorkflowPublicApi,
  'workflow-no-async-query-handler': noAsyncQueryHandler,
  'workflow-no-assert-in-production-workflow': noAssertInProductionWorkflow,
  'workflow-no-busy-wait': noBusyWait,
  'workflow-no-client-import': noClientImport,
  'workflow-no-console': noConsole,
  'workflow-no-continue-as-new-in-update-handler': noContinueAsNewInUpdateHandler,
  'workflow-no-continue-as-new-without-state-argument':
    noContinueAsNewWithoutStateArgument,
  'workflow-no-bigint-in-payload': noBigintInPayload,
  'workflow-no-crypto-random': noCryptoRandom,
  'workflow-no-crypto-random-uuid': noCryptoRandomUuid,
  'workflow-no-date-object-in-payload': noDateObjectInPayload,
  'workflow-no-date-now-tight-loop': noDateNowTightLoop,
  'workflow-no-duplicate-patch-ids': noDuplicatePatchIds,
  'workflow-no-dynamic-import': noDynamicImport,
  'workflow-no-dynamic-require': noDynamicRequire,
  'workflow-no-error-as-payload': noErrorAsPayload,
  'workflow-no-fs-in-workflow': noFsInWorkflow,
  'workflow-no-finalization-registry': noFinalizationRegistry,
  'workflow-no-floating-promises': noFloatingPromises,
  'workflow-no-frequent-search-attribute-upserts': noFrequentSearchAttributeUpserts,
  'workflow-no-heavy-cpu-in-workflow': noHeavyCpuInWorkflow,
  'workflow-no-large-inline-constants': noLargeInlineConstants,
  'workflow-no-large-literal-activity-payloads': noLargeLiteralActivityPayloads,
  'workflow-no-large-literal-payloads': noLargeLiteralPayloads,
  'workflow-local-activity-options-required': localActivityOptionsRequired,
  'workflow-no-logger-library-in-workflow': noLoggerLibraryInWorkflow,
  'workflow-no-mixed-scope-exports': noMixedScopeExports,
  'workflow-no-network-in-workflow': noNetworkInWorkflow,
  'workflow-no-node-or-dom-imports': noNodeOrDomImports,
  'workflow-no-nondeterministic-control-flow': noNondeterministicControlFlow,
  'workflow-no-process-env': noProcessEnv,
  'workflow-no-query-mutation': noQueryMutation,
  'workflow-no-retry-for-nonidempotent-activities': noRetryForNonIdempotentActivities,
  'workflow-no-settimeout-in-cancellation-scope': noSetTimeoutInCancellationScope,
  'workflow-no-shared-array-buffer': noSharedArrayBuffer,
  'workflow-no-setinterval': noSetInterval,
  'workflow-no-swallow-cancellation': noSwallowCancellation,
  'workflow-non-cancellable-cleanup-required': nonCancellableCleanupRequired,
  'workflow-no-top-level-workflow-side-effects': noTopLevelWorkflowSideEffects,
  'workflow-no-throw-raw-error': noThrowRawError,
  'workflow-no-unsafe-global-mutation': noUnsafeGlobalMutation,
  'workflow-no-unsafe-package-imports': noUnsafePackageImports,
  'workflow-no-uuid-library-in-workflow': noUuidLibraryInWorkflow,
  'workflow-no-wall-clock-assumptions': noWallClockAssumptions,
  'workflow-no-weakref': noWeakRef,
  'workflow-no-worker-import': noWorkerImport,
  'workflow-no-workflow-apis-in-query': noWorkflowApisInQuery,
  'workflow-no-workflow-prng-for-persisted-ids': noWorkflowPrngForPersistedIds,
  'workflow-no-nonserializable-types-in-payloads': noNonserializableTypesInPayloads,
  'workflow-patch-id-literal': patchIdLiteral,
  'workflow-patched-must-guard-incompatible-change': patchedMustGuardIncompatibleChange,
  'workflow-prefer-cancellation-scope-with-timeout': preferCancellationScopeWithTimeout,
  'workflow-prefer-condition-over-polling': preferConditionOverPolling,
  'workflow-prefer-local-activity-for-nondeterministic-value':
    preferLocalActivityForNondeterministicValue,
  'workflow-prefer-sleep': preferSleep,
  'workflow-prefer-single-object-args': preferSingleObjectWorkflowArgs,
  'workflow-prefer-workflow-uuid': preferWorkflowUuid,
  'workflow-require-explicit-payload-types': requireExplicitPayloadTypes,
  'workflow-replay-testing-required-comment': replayTestingRequiredComment,
  'workflow-require-deprecate-patch-after-branch-removal':
    requireDeprecatePatchAfterBranchRemoval,
  'workflow-require-idempotency-key-arg': requireIdempotencyKeyArg,
  'workflow-require-activity-retry-policy': requireActivityRetryPolicy,
  'workflow-require-activity-timeouts': requireActivityTimeouts,
  'workflow-require-all-handlers-finished': requireAllHandlersFinished,
  'workflow-require-handler-serialization-safe-types':
    requireHandlerSerializationSafeTypes,
  'workflow-require-message-definitions-at-module-scope':
    requireMessageDefinitionsAtModuleScope,
  'workflow-require-set-handler-early': requireSetHandlerEarly,
  'workflow-require-type-only-activity-imports': requireTypeOnlyActivityImports,
  'workflow-search-attributes-upsert-shape': searchAttributesUpsertShape,
  'workflow-signal-handler-returns-void': signalHandlerReturnsVoid,
  'workflow-sink-args-must-be-cloneable': sinkArgsMustBeCloneable,
  'workflow-sink-no-await': sinkNoAwait,
  'workflow-sink-no-return-value': sinkNoReturnValue,
  'workflow-update-handler-return-type': updateHandlerReturnType,
  'workflow-uuid4-requires-security-comment': uuid4RequiresSecurityComment,

  // Activity rules
  'activity-prefer-activity-log': preferActivityLog,
  'activity-prefer-applicationfailure': preferApplicationFailure,
  'activity-prefer-single-object-args': preferSingleObjectActivityArgs,
  'activity-heartbeat-in-long-loops': heartbeatInLongLoops,
  'activity-use-cancellation-signal': useCancellationSignal,
  'activity-context-not-stored': contextNotStored,

  // Worker rules
  'worker-no-workflow-or-activity-definitions': noWorkflowOrActivityDefinitions,
  'worker-ignoremodules-requires-comment': ignoremodulesRequiresComment,
  'worker-require-call-during-replay-explicit': requireCallDuringReplayExplicit,

  // Client rules
  'client-require-workflow-id': requireWorkflowId,

  // Test rules
  'test-teardown-required': testTeardownRequired,
  'test-worker-run-until-required': testWorkerRunUntilRequired,
  'test-import-type-for-activities': testImportTypeForActivities,
  'replay-history-smoke-test-hook': replayHistorySmokeTestHook,

  // Shared rules
  'task-queue-constant': taskQueueConstant,
  'no-temporal-internal-imports': noTemporalInternalImports,
  'no-workflow-and-activity-in-same-file': noWorkflowAndActivityInSameFile,
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>;

export type RuleKey = keyof typeof rules;
