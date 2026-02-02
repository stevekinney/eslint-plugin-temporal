import { Worker } from '@temporalio/worker';

export async function runReplayHistorySmokeTest(): Promise<void> {
  await Worker.runReplayHistories({
    workflowsPath: require.resolve('../workflows'),
    histories: [],
  });
}
