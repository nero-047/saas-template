import { randomUUID } from 'node:crypto';

import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  loadQueueConfig,
  parsePlatformJob,
  queueNameForJob,
  type JobContext,
  type PlatformEvent,
  type PlatformJobName,
  type PlatformJobPayload,
  type QueueClient,
  type QueueClientFactory,
  type QueueRuntimeConfig,
} from '@saas-template/jobs';

import { RequestContextService } from '../../common/context/request-context.service';
import { QUEUE_CLIENT_FACTORY } from './queue.tokens';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly clients = new Map<string, QueueClient>();
  private config?: QueueRuntimeConfig;

  constructor(
    private readonly requestContext: RequestContextService,
    @Inject(QUEUE_CLIENT_FACTORY)
    private readonly clientFactory: QueueClientFactory,
  ) {}

  async enqueueJob<TName extends PlatformJobName>(
    name: TName,
    payload: PlatformJobPayload[TName],
  ): Promise<string> {
    const envelope = parsePlatformJob(name, {
      context: this.captureContext(),
      createdAt: new Date().toISOString(),
      payload,
    });
    const result = await this.getClient(queueNameForJob(name)).add(
      name,
      envelope,
    );
    if (!result.id) {
      throw new Error('Queue accepted a job without assigning an ID.');
    }
    return result.id;
  }

  publishPlatformEvent(event: PlatformEvent): Promise<string> {
    switch (event.type) {
      case 'EMAIL_SEND':
        return this.enqueueJob(event.type, event.payload);
      case 'NOTIFICATION_SEND':
        return this.enqueueJob(event.type, event.payload);
    }
  }

  async onModuleDestroy(): Promise<void> {
    const clients = [...this.clients.values()];
    this.clients.clear();
    await Promise.all(clients.map((client) => client.close()));
  }

  private captureContext(): JobContext {
    const context = this.requestContext.getOptional();
    return {
      requestId: context?.requestId ?? randomUUID(),
      userId: context?.userId,
      organizationId: context?.organizationId,
      workspaceId: context?.workspaceId,
    };
  }

  private getClient(queueName: string): QueueClient {
    const existing = this.clients.get(queueName);
    if (existing) {
      return existing;
    }
    this.config ??= loadQueueConfig();
    const created = this.clientFactory(queueName, this.config);
    this.clients.set(queueName, created);
    return created;
  }
}
