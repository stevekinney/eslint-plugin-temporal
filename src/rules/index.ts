import type { TSESLint } from '@typescript-eslint/utils';

import { contextNotStored } from './activity/context-not-stored.ts';
import { heartbeatInLongLoops } from './activity/heartbeat-in-long-loops.ts';
// Activity rules
import { preferActivityLog } from './activity/prefer-activity-log.ts';
import { preferApplicationFailure } from './activity/prefer-applicationfailure.ts';
import { useCancellationSignal } from './activity/use-cancellation-signal.ts';
// Client rules
import { requireWorkflowId } from './client/require-workflow-id.ts';
import { noTemporalInternalImports } from './shared/no-temporal-internal-imports.ts';
import { noWorkflowAndActivityInSameFile } from './shared/no-workflow-and-activity-in-same-file.ts';
// Shared rules
import { taskQueueConstant } from './shared/task-queue-constant.ts';
import { ignoremodulesRequiresComment } from './worker/ignoremodules-requires-comment.ts';
// Worker rules
import { noWorkflowOrActivityDefinitions } from './worker/no-workflow-or-activity-definitions.ts';
// Workflow rules
import { conditionTimeoutStyle } from './workflow/condition-timeout-style.ts';
import { deprecatePatchRequiresComment } from './workflow/deprecate-patch-requires-comment.ts';
import { durationFormat } from './workflow/duration-format.ts';
import { messageNameLiteral } from './workflow/message-name-literal.ts';
import { noActivityDefinitionsImport } from './workflow/no-activity-definitions-import.ts';
import { noAsyncQueryHandler } from './workflow/no-async-query-handler.ts';
import { noBusyWait } from './workflow/no-busy-wait.ts';
import { noClientImport } from './workflow/no-client-import.ts';
import { noConsole } from './workflow/no-console.ts';
import { noContinueAsNewInUpdateHandler } from './workflow/no-continueAsNew-in-update-handler.ts';
import { noCryptoRandomUuid } from './workflow/no-crypto-random-uuid.ts';
import { noDateNowTightLoop } from './workflow/no-date-now-tight-loop.ts';
import { noDuplicatePatchIds } from './workflow/no-duplicate-patch-ids.ts';
import { noDynamicImport } from './workflow/no-dynamic-import.ts';
import { noDynamicRequire } from './workflow/no-dynamic-require.ts';
import { noFinalizationRegistry } from './workflow/no-finalization-registry.ts';
import { noFloatingPromises } from './workflow/no-floating-promises.ts';
import { noFsInWorkflow } from './workflow/no-fs-in-workflow.ts';
import { noHeavyCpuInWorkflow } from './workflow/no-heavy-cpu-in-workflow.ts';
import { noLargeLiteralPayloads } from './workflow/no-large-literal-payloads.ts';
import { noLoggerLibraryInWorkflow } from './workflow/no-logger-library-in-workflow.ts';
import { noMixedScopeExports } from './workflow/no-mixed-scope-exports.ts';
import { noNetworkInWorkflow } from './workflow/no-network-in-workflow.ts';
import { noNodeOrDomImports } from './workflow/no-node-or-dom-imports.ts';
import { noNondeterministicControlFlow } from './workflow/no-nondeterministic-control-flow.ts';
import { noProcessEnv } from './workflow/no-process-env.ts';
import { noQueryMutation } from './workflow/no-query-mutation.ts';
import { noSetInterval } from './workflow/no-setinterval.ts';
import { noThrowRawError } from './workflow/no-throw-raw-error.ts';
import { noTopLevelWorkflowSideEffects } from './workflow/no-top-level-workflow-side-effects.ts';
import { noUnsafeGlobalMutation } from './workflow/no-unsafe-global-mutation.ts';
import { noUnsafePackageImports } from './workflow/no-unsafe-package-imports.ts';
import { noUuidLibraryInWorkflow } from './workflow/no-uuid-library-in-workflow.ts';
import { noWallClockAssumptions } from './workflow/no-wall-clock-assumptions.ts';
import { noWeakRef } from './workflow/no-weakref.ts';
import { noWorkerImport } from './workflow/no-worker-import.ts';
import { noWorkflowApisInQuery } from './workflow/no-workflow-apis-in-query.ts';
import { patchIdLiteral } from './workflow/patch-id-literal.ts';
import { preferConditionOverPolling } from './workflow/prefer-condition-over-polling.ts';
import { preferSleep } from './workflow/prefer-sleep.ts';
import { preferWorkflowUuid } from './workflow/prefer-workflow-uuid.ts';
import { requireActivityRetryPolicy } from './workflow/require-activity-retry-policy.ts';
import { requireActivityTimeouts } from './workflow/require-activity-timeouts.ts';
import { requireAllHandlersFinished } from './workflow/require-all-handlers-finished.ts';
import { requireSetHandlerEarly } from './workflow/require-setHandler-early.ts';
import { requireTypeOnlyActivityImports } from './workflow/require-type-only-activity-imports.ts';
import { signalHandlerReturnsVoid } from './workflow/signal-handler-returns-void.ts';
import { sinkNoAwait } from './workflow/sink-no-await.ts';
import { sinkNoReturnValue } from './workflow/sink-no-return-value.ts';
import { updateHandlerReturnType } from './workflow/update-handler-return-type.ts';
import { uuid4RequiresSecurityComment } from './workflow/uuid4-requires-security-comment.ts';

/**
 * All rules exported by the plugin
 */
export const rules = {
  // Workflow rules
  'workflow-condition-timeout-style': conditionTimeoutStyle,
  'workflow-deprecate-patch-requires-comment': deprecatePatchRequiresComment,
  'workflow-duration-format': durationFormat,
  'workflow-message-name-literal': messageNameLiteral,
  'workflow-no-activity-definitions-import': noActivityDefinitionsImport,
  'workflow-no-async-query-handler': noAsyncQueryHandler,
  'workflow-no-busy-wait': noBusyWait,
  'workflow-no-client-import': noClientImport,
  'workflow-no-console': noConsole,
  'workflow-no-continueAsNew-in-update-handler': noContinueAsNewInUpdateHandler,
  'workflow-no-crypto-random-uuid': noCryptoRandomUuid,
  'workflow-no-date-now-tight-loop': noDateNowTightLoop,
  'workflow-no-duplicate-patch-ids': noDuplicatePatchIds,
  'workflow-no-dynamic-import': noDynamicImport,
  'workflow-no-dynamic-require': noDynamicRequire,
  'workflow-no-fs-in-workflow': noFsInWorkflow,
  'workflow-no-finalization-registry': noFinalizationRegistry,
  'workflow-no-floating-promises': noFloatingPromises,
  'workflow-no-heavy-cpu-in-workflow': noHeavyCpuInWorkflow,
  'workflow-no-large-literal-payloads': noLargeLiteralPayloads,
  'workflow-no-logger-library-in-workflow': noLoggerLibraryInWorkflow,
  'workflow-no-mixed-scope-exports': noMixedScopeExports,
  'workflow-no-network-in-workflow': noNetworkInWorkflow,
  'workflow-no-node-or-dom-imports': noNodeOrDomImports,
  'workflow-no-nondeterministic-control-flow': noNondeterministicControlFlow,
  'workflow-no-process-env': noProcessEnv,
  'workflow-no-query-mutation': noQueryMutation,
  'workflow-no-setinterval': noSetInterval,
  'workflow-no-top-level-workflow-side-effects': noTopLevelWorkflowSideEffects,
  'workflow-no-throw-raw-error': noThrowRawError,
  'workflow-no-unsafe-global-mutation': noUnsafeGlobalMutation,
  'workflow-no-unsafe-package-imports': noUnsafePackageImports,
  'workflow-no-uuid-library-in-workflow': noUuidLibraryInWorkflow,
  'workflow-no-wall-clock-assumptions': noWallClockAssumptions,
  'workflow-no-weakref': noWeakRef,
  'workflow-no-worker-import': noWorkerImport,
  'workflow-no-workflow-apis-in-query': noWorkflowApisInQuery,
  'workflow-patch-id-literal': patchIdLiteral,
  'workflow-prefer-condition-over-polling': preferConditionOverPolling,
  'workflow-prefer-sleep': preferSleep,
  'workflow-prefer-workflow-uuid': preferWorkflowUuid,
  'workflow-require-activity-retry-policy': requireActivityRetryPolicy,
  'workflow-require-activity-timeouts': requireActivityTimeouts,
  'workflow-require-all-handlers-finished': requireAllHandlersFinished,
  'workflow-require-setHandler-early': requireSetHandlerEarly,
  'workflow-require-type-only-activity-imports': requireTypeOnlyActivityImports,
  'workflow-signal-handler-returns-void': signalHandlerReturnsVoid,
  'workflow-sink-no-await': sinkNoAwait,
  'workflow-sink-no-return-value': sinkNoReturnValue,
  'workflow-update-handler-return-type': updateHandlerReturnType,
  'workflow-uuid4-requires-security-comment': uuid4RequiresSecurityComment,

  // Activity rules
  'activity-prefer-activity-log': preferActivityLog,
  'activity-prefer-applicationfailure': preferApplicationFailure,
  'activity-heartbeat-in-long-loops': heartbeatInLongLoops,
  'activity-use-cancellation-signal': useCancellationSignal,
  'activity-context-not-stored': contextNotStored,

  // Worker rules
  'worker-no-workflow-or-activity-definitions': noWorkflowOrActivityDefinitions,
  'worker-ignoremodules-requires-comment': ignoremodulesRequiresComment,

  // Client rules
  'client-require-workflow-id': requireWorkflowId,

  // Shared rules
  'task-queue-constant': taskQueueConstant,
  'no-temporal-internal-imports': noTemporalInternalImports,
  'no-workflow-and-activity-in-same-file': noWorkflowAndActivityInSameFile,
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>;

export type RuleKey = keyof typeof rules;
