import { Worker } from '@temporalio/worker';

export const runReplayHistorySmokeTest = async () => {
  await Worker.runReplayHistories({
    workflowsPath: '/tmp/workflows',
    histories: [],
  });
};
