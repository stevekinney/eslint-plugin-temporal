declare const Worker: {
  runReplayHistories: (args: {
    workflowsPath: string;
    histories: unknown[];
  }) => Promise<void>;
};

export async function runReplayHistorySmokeTest(): Promise<void> {
  await Worker.runReplayHistories({
    workflowsPath: '/tmp/workflows',
    histories: [],
  });
}
