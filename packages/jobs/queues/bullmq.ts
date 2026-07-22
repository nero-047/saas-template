import {
  Queue,
  Worker,
  type Job,
  type JobsOptions,
  type Processor,
} from 'bullmq';

import type { JobEnvelope } from '../types/job.js';
import type { QueueRuntimeConfig } from './config.js';

export interface QueueClient {
  add(
    name: string,
    data: JobEnvelope<unknown>,
    options?: JobsOptions,
  ): Promise<{ readonly id?: string }>;
  close(): Promise<void>;
}

export interface WorkerClient {
  close(): Promise<void>;
  waitUntilReady(): Promise<unknown>;
  on(event: 'completed', listener: (job: Job) => void): this;
  on(
    event: 'failed',
    listener: (job: Job | undefined, error: Error) => void,
  ): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

export type QueueClientFactory = (
  queueName: string,
  config: QueueRuntimeConfig,
) => QueueClient;

export type WorkerClientFactory = (
  queueName: string,
  processor: Processor,
  config: QueueRuntimeConfig,
  concurrency: number,
) => WorkerClient;

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
};

export const createBullMqQueue: QueueClientFactory = (queueName, config) =>
  new Queue(queueName, {
    connection: {
      ...config.connection,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    },
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
    prefix: config.prefix,
  });

export const createBullMqWorker: WorkerClientFactory = (
  queueName,
  processor,
  config,
  concurrency,
) =>
  new Worker(queueName, processor, {
    connection: {
      ...config.connection,
      maxRetriesPerRequest: null,
    },
    concurrency,
    prefix: config.prefix,
  });
