import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { OrganizationsModule } from '../../modules/organizations/organizations.module';
import { PermissionsModule } from '../../modules/permissions/permissions.module';
import { WorkspacesModule } from '../../modules/workspaces/workspaces.module';
import { PermissionGuard } from './permission.guard';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';
import {
  OrganizationContextGuard,
  WorkspaceContextGuard,
} from './tenant-context.guards';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  imports: [OrganizationsModule, WorkspacesModule, PermissionsModule],
  providers: [
    RequestContextMiddleware,
    RequestContextService,
    TenantContextService,
    OrganizationContextGuard,
    WorkspaceContextGuard,
    PermissionGuard,
  ],
  exports: [
    RequestContextService,
    TenantContextService,
    OrganizationContextGuard,
    WorkspaceContextGuard,
    PermissionGuard,
  ],
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
