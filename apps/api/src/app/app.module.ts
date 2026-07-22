import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { RequestContextModule } from '../common/context/request-context.module';
import { ApiExceptionFilter } from '../common/errors/api-exception.filter';
import { AuthModule } from '../modules/auth/auth.module';
import { DatabaseModule } from '../modules/database/database.module';
import { HealthModule } from '../modules/health/health.module';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { QueueModule } from '../modules/queue/queue.module';
import { UsersModule } from '../modules/users/users.module';
import { WorkspacesModule } from '../modules/workspaces/workspaces.module';

@Module({
  imports: [
    DatabaseModule,
    RequestContextModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    WorkspacesModule,
    PermissionsModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
