import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  loadQueueConfig,
  type WorkerClient,
  type WorkerClientFactory,
} from '@saas-template/jobs';

import { loadWorkerEnvironment } from '../config/environment';
import {
  PLATFORM_JOB_PROCESSORS,
  type PlatformJobProcessor,
} from './job-processor';
import { WORKER_CLIENT_FACTORY } from './worker.tokens';

@Injectable()
export class JobConsumersService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(JobConsumersService.name);
  private readonly workers: WorkerClient[] = [];

  constructor(
    @Inject(PLATFORM_JOB_PROCESSORS)
    private readonly processors: readonly PlatformJobProcessor[],
    @Inject(WORKER_CLIENT_FACTORY)
    private readonly workerFactory: WorkerClientFactory,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const queueConfig = loadQueueConfig();
    const { concurrency } = loadWorkerEnvironment();

    try {
      for (const processor of this.processors) {
        const worker = this.workerFactory(
          processor.queueName,
          async (job) => {
            if (job.name !== processor.jobName) {
              throw new Error(
                `Unsupported job name on ${processor.queueName}.`,
              );
            }
            return processor.process(job.data);
          },
          queueConfig,
          concurrency,
        );
        worker.on('completed', (job) => {
          this.logger.log(
            `Completed ${processor.jobName} job ${job.id ?? 'unknown'}.`,
          );
        });
        worker.on('failed', (job) => {
          this.logger.error(
            `Failed ${processor.jobName} job ${job?.id ?? 'unknown'}.`,
          );
        });
        worker.on('error', () => {
          this.logger.error(`Queue worker error for ${processor.queueName}.`);
        });
        this.workers.push(worker);
      }

      await Promise.all(this.workers.map((worker) => worker.waitUntilReady()));
    } catch (error) {
      await this.onApplicationShutdown();
      throw error;
    }

    this.logger.log(`Started ${this.workers.length} queue consumers.`);
  }

  async onApplicationShutdown(): Promise<void> {
    const workers = this.workers.splice(0);
    await Promise.all(workers.map((worker) => worker.close()));
  }
}
