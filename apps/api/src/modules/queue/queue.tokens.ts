import {
  createBullMqQueue,
  type QueueClientFactory,
} from '@saas-template/jobs';

export const QUEUE_CLIENT_FACTORY = Symbol('QUEUE_CLIENT_FACTORY');
export const queueClientFactory: QueueClientFactory = createBullMqQueue;
