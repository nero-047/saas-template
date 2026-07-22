import { Injectable } from '@nestjs/common';
import {
  emailSendJobSchema,
  PLATFORM_JOB_NAMES,
  PLATFORM_QUEUE_NAMES,
} from '@saas-template/jobs';

import { WorkerContextService } from '../context/worker-context.service';
import type { PlatformJobProcessor } from './job-processor';

@Injectable()
export class EmailProcessor implements PlatformJobProcessor {
  readonly jobName = PLATFORM_JOB_NAMES.emailSend;
  readonly queueName = PLATFORM_QUEUE_NAMES.email;

  constructor(private readonly context: WorkerContextService) {}

  process(data: unknown): Promise<{ readonly status: 'accepted' }> {
    const envelope = emailSendJobSchema.parse(data);
    return this.context.run(envelope.context, async () => {
      // Provider delivery belongs here when an email provider is introduced.
      return { status: 'accepted' as const };
    });
  }
}
