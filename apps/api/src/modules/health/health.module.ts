import { Module } from '@nestjs/common';

import { DatabaseHealthIndicator } from './database-health.indicator';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, HealthService],
})
export class HealthModule {}
