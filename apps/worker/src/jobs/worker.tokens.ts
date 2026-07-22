import {
  createBullMqWorker,
  type WorkerClientFactory,
} from '@saas-template/jobs';

export const WORKER_CLIENT_FACTORY = Symbol('WORKER_CLIENT_FACTORY');
export const workerClientFactory: WorkerClientFactory = createBullMqWorker;
