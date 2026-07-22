import { Module } from '@nestjs/common';

import { AuthModule } from '../modules/auth/auth.module';
import { DatabaseModule } from '../modules/database/database.module';
import { HealthModule } from '../modules/health/health.module';
import { OrganizationsModule } from '../modules/organizations/organizations.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { UsersModule } from '../modules/users/users.module';
import { WorkspacesModule } from '../modules/workspaces/workspaces.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    WorkspacesModule,
    PermissionsModule,
  ],
})
export class AppModule {}
