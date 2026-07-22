import { Module } from '@nestjs/common';

import { OrganizationsModule } from '../organizations/organizations.module';
import { WorkspacesRepository } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [OrganizationsModule],
  providers: [WorkspacesRepository, WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
