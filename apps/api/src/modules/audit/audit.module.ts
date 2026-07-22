import { Module } from '@nestjs/common';

import { RequestContextModule } from '../../common/context/request-context.module';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [RequestContextModule],
  providers: [AuditLogRepository, AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
