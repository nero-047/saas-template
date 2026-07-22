export interface WorkerEnvironment {
  readonly concurrency: number;
}

const DEFAULT_CONCURRENCY = 5;

export function loadWorkerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): WorkerEnvironment {
  const value = environment.WORKER_CONCURRENCY?.trim();
  if (!value) {
    return { concurrency: DEFAULT_CONCURRENCY };
  }
  if (!/^\d+$/.test(value)) {
    throw new Error('WORKER_CONCURRENCY must be an integer between 1 and 100.');
  }
  const concurrency = Number(value);
  if (concurrency < 1 || concurrency > 100) {
    throw new Error('WORKER_CONCURRENCY must be an integer between 1 and 100.');
  }
  return { concurrency };
}
