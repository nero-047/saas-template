import {
  PLATFORM_JOB_NAMES,
  PLATFORM_QUEUE_NAMES,
  type QueueClient,
  type QueueClientFactory,
} from '@saas-template/jobs';

import type { ContextCarrierRequest } from '../../common/context/request-context';
import { RequestContextService } from '../../common/context/request-context.service';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('creates a client lazily and propagates request and tenant context', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379/0';
    const add = jest.fn().mockResolvedValue({ id: 'job-1' });
    const close = jest.fn().mockResolvedValue(undefined);
    const client: QueueClient = { add, close };
    const factory: jest.MockedFunction<QueueClientFactory> = jest.fn(
      (...arguments_: Parameters<QueueClientFactory>) => {
        void arguments_;
        return client;
      },
    );
    const context = new RequestContextService();
    const service = new QueueService(context, factory);

    expect(factory).not.toHaveBeenCalled();
    const request: ContextCarrierRequest = {};
    const id = await context.run(
      request,
      async () => {
        context.setAuthenticatedUser({
          id: '00000000-0000-4000-8000-000000000001',
          sessionId: '00000000-0000-4000-8000-000000000002',
        });
        context.setOrganization('00000000-0000-4000-8000-000000000003', []);
        context.setWorkspace('00000000-0000-4000-8000-000000000004', []);
        return service.enqueueJob(PLATFORM_JOB_NAMES.emailSend, {
          to: 'recipient@example.com',
          subject: 'Subject',
          text: 'Body',
        });
      },
      '00000000-0000-4000-8000-000000000005',
    );

    expect(id).toBe('job-1');
    expect(factory).toHaveBeenCalledWith(
      PLATFORM_QUEUE_NAMES.email,
      expect.objectContaining({ prefix: 'saas-template' }),
    );
    expect(add).toHaveBeenCalledWith(
      PLATFORM_JOB_NAMES.emailSend,
      expect.objectContaining({
        context: {
          requestId: '00000000-0000-4000-8000-000000000005',
          userId: '00000000-0000-4000-8000-000000000001',
          organizationId: '00000000-0000-4000-8000-000000000003',
          workspaceId: '00000000-0000-4000-8000-000000000004',
        },
      }),
    );
    await service.onModuleDestroy();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('publishes a platform event as its matching durable job', async () => {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379';
    const add = jest.fn().mockResolvedValue({ id: 'job-2' });
    const client: QueueClient = {
      add,
      close: jest.fn().mockResolvedValue(undefined),
    };
    const context = new RequestContextService();
    const service = new QueueService(context, () => client);

    await service.publishPlatformEvent({
      type: PLATFORM_JOB_NAMES.notificationSend,
      payload: {
        recipientUserId: '00000000-0000-4000-8000-000000000001',
        title: 'Title',
        body: 'Body',
      },
    });

    expect(add).toHaveBeenCalledWith(
      PLATFORM_JOB_NAMES.notificationSend,
      expect.objectContaining({
        context: expect.objectContaining({ requestId: expect.any(String) }),
      }),
    );
  });
});
