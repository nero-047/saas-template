import { Module } from '@nestjs/common';

import { WorkerContextService } from '../context/worker-context.service';
import { EmailProcessor } from './email.processor';
import { JobConsumersService } from './job-consumers.service';
import { PLATFORM_JOB_PROCESSORS } from './job-processor';
import { NotificationProcessor } from './notification.processor';
import { WORKER_CLIENT_FACTORY, workerClientFactory } from './worker.tokens';

@Module({
  providers: [
    WorkerContextService,
    EmailProcessor,
    NotificationProcessor,
    JobConsumersService,
    {
      provide: PLATFORM_JOB_PROCESSORS,
      inject: [EmailProcessor, NotificationProcessor],
      useFactory: (
        email: EmailProcessor,
        notification: NotificationProcessor,
      ) => [email, notification],
    },
    { provide: WORKER_CLIENT_FACTORY, useValue: workerClientFactory },
  ],
  exports: [WorkerContextService],
})
export class JobsModule {}
