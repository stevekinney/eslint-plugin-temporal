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
// Shared rules
import { taskQueueConstant } from './shared/task-queue-constant.ts';
import { ignoremodulesRequiresComment } from './worker/ignoremodules-requires-comment.ts';
// Worker rules
import { noWorkflowOrActivityDefinitions } from './worker/no-workflow-or-activity-definitions.ts';
// Workflow rules
import { noActivityDefinitionsImport } from './workflow/no-activity-definitions-import.ts';
import { noConsole } from './workflow/no-console.ts';
import { noFloatingPromises } from './workflow/no-floating-promises.ts';
import { noNodeOrDomImports } from './workflow/no-node-or-dom-imports.ts';
import { noThrowRawError } from './workflow/no-throw-raw-error.ts';
import { noUnsafePackageImports } from './workflow/no-unsafe-package-imports.ts';
import { patchIdLiteral } from './workflow/patch-id-literal.ts';
import { preferWorkflowUuid } from './workflow/prefer-workflow-uuid.ts';
import { requireActivityTimeouts } from './workflow/require-activity-timeouts.ts';

/**
 * All rules exported by the plugin
 */
export const rules = {
  // Workflow rules
  'workflow-no-activity-definitions-import': noActivityDefinitionsImport,
  'workflow-no-node-or-dom-imports': noNodeOrDomImports,
  'workflow-no-unsafe-package-imports': noUnsafePackageImports,
  'workflow-require-activity-timeouts': requireActivityTimeouts,
  'workflow-no-console': noConsole,
  'workflow-prefer-workflow-uuid': preferWorkflowUuid,
  'workflow-no-floating-promises': noFloatingPromises,
  'workflow-no-throw-raw-error': noThrowRawError,
  'workflow-patch-id-literal': patchIdLiteral,

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
} satisfies Record<string, TSESLint.RuleModule<string, unknown[]>>;

export type RuleKey = keyof typeof rules;
