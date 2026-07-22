import { Injectable } from '@nestjs/common';
import {
  notificationSendJobSchema,
  PLATFORM_JOB_NAMES,
  PLATFORM_QUEUE_NAMES,
} from '@saas-template/jobs';

import { WorkerContextService } from '../context/worker-context.service';
import type { PlatformJobProcessor } from './job-processor';

@Injectable()
export class NotificationProcessor implements PlatformJobProcessor {
  readonly jobName = PLATFORM_JOB_NAMES.notificationSend;
  readonly queueName = PLATFORM_QUEUE_NAMES.notification;

  constructor(private readonly context: WorkerContextService) {}

  process(data: unknown): Promise<{ readonly status: 'accepted' }> {
    const envelope = notificationSendJobSchema.parse(data);
    return this.context.run(envelope.context, async () => {
      // Provider delivery belongs here when notification channels are added.
      return { status: 'accepted' as const };
    });
  }
}
