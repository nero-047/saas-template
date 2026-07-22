import type { WorkerClient, WorkerClientFactory } from '@saas-template/jobs';

import type { PlatformJobProcessor } from './job-processor';
import { JobConsumersService } from './job-consumers.service';

describe('JobConsumersService', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('registers each processor and closes every worker', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    const close = jest.fn().mockResolvedValue(undefined);
    const worker: WorkerClient = {
      close,
      waitUntilReady: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockReturnThis(),
    };
    const factory: jest.MockedFunction<WorkerClientFactory> = jest.fn(
      (...arguments_: Parameters<WorkerClientFactory>) => {
        void arguments_;
        return worker;
      },
    );
    const processors: PlatformJobProcessor[] = [
      {
        queueName: 'platform-email',
        jobName: 'EMAIL_SEND',
        process: jest.fn().mockResolvedValue(undefined),
      },
      {
        queueName: 'platform-notification',
        jobName: 'NOTIFICATION_SEND',
        process: jest.fn().mockResolvedValue(undefined),
      },
    ];
    const service = new JobConsumersService(processors, factory);

    await service.onApplicationBootstrap();

    expect(factory).toHaveBeenCalledTimes(2);
    expect(factory).toHaveBeenNthCalledWith(
      1,
      'platform-email',
      expect.any(Function),
      expect.objectContaining({ prefix: 'saas-template' }),
      5,
    );
    expect(factory).toHaveBeenNthCalledWith(
      2,
      'platform-notification',
      expect.any(Function),
      expect.objectContaining({ prefix: 'saas-template' }),
      5,
    );

    await service.onApplicationShutdown();
    expect(close).toHaveBeenCalledTimes(2);
  });
});
