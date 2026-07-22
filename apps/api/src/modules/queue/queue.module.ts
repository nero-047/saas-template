import { Module } from '@nestjs/common';

import { RequestContextModule } from '../../common/context/request-context.module';
import { QueueService } from './queue.service';
import { QUEUE_CLIENT_FACTORY, queueClientFactory } from './queue.tokens';

@Module({
  imports: [RequestContextModule],
  providers: [
    QueueService,
    { provide: QUEUE_CLIENT_FACTORY, useValue: queueClientFactory },
  ],
  exports: [QueueService],
})
export class QueueModule {}
