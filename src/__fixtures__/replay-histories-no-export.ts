import { Worker } from '@temporalio/worker';

async function runReplayHistorySmokeTest(): Promise<void> {
  await Worker.runReplayHistories({
    workflowsPath: '/tmp/workflows',
    histories: [],
  });
}
